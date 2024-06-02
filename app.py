from threading import Lock
from flask import Flask, render_template, session, request, jsonify, url_for, send_from_directory
from flask_socketio import SocketIO, emit, disconnect    
import time
import json
import MySQLdb
import configparser as ConfigParser
import serial
import random
from datetime import datetime
import os

async_mode = None

app = Flask(__name__)

config = ConfigParser.ConfigParser()
config.read('config.cfg')
myhost = config.get('mysqlDB', 'host')
myuser = config.get('mysqlDB', 'user')
mypasswd = config.get('mysqlDB', 'passwd')
mydb = config.get('mysqlDB', 'db')
print(myhost)

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock() 

ser = serial.Serial('/dev/ttyS0', 115200, timeout=1)
ser.flush()

def background_thread(args):
    count = 0  
    dataList = []
    temperature = 'false'
    light = 'false'         
    enable = 'false'
    db = MySQLdb.connect(host=myhost,user=myuser,passwd=mypasswd,db=mydb)            
    while True:
        if args:
          temperature = dict(args).get('temperature')
          light = dict(args).get('light')
          enable = dict(args).get('enable')
        print(args)
        socketio.sleep(2)
        if enable == 'true':
          now = datetime.now()
          datetimeString = now.strftime("%Y-%m-%d %H:%M:%S")
          count += 1
          line = ser.readline().decode('utf-8').rstrip()
          data = json.loads(line)
          print(data)
          #num = random.random()
          dataDict = {
            "datetime": datetimeString
          }
          if temperature:
             dataDict["temperature"] = data["temperature"]
          
          if light:
             dataDict["light"] = data["light"]
          
          print(dataDict)
          dataList.append(dataDict)
          socketio.emit('my_response',
                        {'data': dataDict, 'count': count},
                        namespace='/test')
        else:
          if len(dataList)>0:
            print(str(dataList))
            fuj = str(dataList).replace("'", "\"")
            print(fuj)
            cursor = db.cursor()
            cursor.execute("SELECT MAX(id) FROM graph")
            maxid = cursor.fetchone()[0]
            if maxid is None:
              new_id = 1
            else:
              new_id = maxid + 1
            cursor.execute("INSERT INTO graph (id, hodnoty) VALUES (%s, %s)", (new_id, fuj))
            db.commit()
          dataList = []
          count = 0

@app.route('/')
def index():
    return render_template('index.html', async_mode=socketio.async_mode)

@app.route('/archive')
def archive():
    return render_template('archive.html', async_mode=socketio.async_mode)
    
@app.route('/graph')
def graph():
    return render_template('graph.html', async_mode=socketio.async_mode)

@app.route('/db')
def db():
  db = MySQLdb.connect(host=myhost,user=myuser,passwd=mypasswd,db=mydb)
  cursor = db.cursor()
  cursor.execute('''SELECT id FROM  graph''')
  rv = cursor.fetchall()
  response = [{"id": row[0]} for row in rv]
  return jsonify(response)

@app.route('/dbdata/<string:num>', methods=['GET', 'POST'])
def dbdata(num):
  db = MySQLdb.connect(host=myhost,user=myuser,passwd=mypasswd,db=mydb)
  cursor = db.cursor()
  print(num)
  cursor.execute("SELECT hodnoty FROM  graph WHERE id=%s", num)
  rv = cursor.fetchone()
  return str(rv[0])
  
@app.route('/downloadfile/<string:num>', methods=['GET', 'POST'])
def downloadfile(num):
  filepath = "static/files/data.txt"
  directory = os.path.dirname(filepath)
  filename = os.path.dirname(filepath)
  downloadpath = os.path.join(app.root_path, 'static/files')
  print(downloadpath)
  
  result = dbdata(num)
  
  with open(filepath, "w") as fo:
    fo.write("%s\r\n" %result)
    
  return send_from_directory(directory='static', filename='files/data.txt', as_attachment=True)
  
@socketio.on('my_event', namespace='/test')
def test_message(message):   
    session['receive_count'] = session.get('receive_count', 0) + 1 
    print(message)
    data = {}
    if 'temperature' in message:
      session['temperature'] = message['temperature']
      data["temperature"] = message['temperature'],
    if 'light' in message:    
      session['light'] = message['light']    
      data["light"] = message['light']
    emit('my_response',
         {'data': data, 'count': session['receive_count']})
 
@socketio.on('disconnect_request', namespace='/test')
def disconnect_request():
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']})
    disconnect()

@socketio.on('connect', namespace='/test')
def test_connect():
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(target=background_thread, args=session._get_current_object())
    emit('my_response', {'data': 'Connected', 'count': 0})

@socketio.on('click_event', namespace='/test')
def db_message(message):   
    session['enable'] = message['value']    

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected', request.sid)

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=80, debug=True)
