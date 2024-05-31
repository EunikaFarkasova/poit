from threading import Lock
from flask import Flask, render_template, session, request, jsonify, url_for, send_from_directory
from flask_socketio import SocketIO, emit, disconnect    
import time
import serial
from datetime import datetime

async_mode = None

app = Flask(__name__)

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
          dataList = []
          count = 0

@app.route('/')
def index():
    return render_template('index.html', async_mode=socketio.async_mode)

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

@socketio.on('connect', namespace='/test')
def test_connect():
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(target=background_thread, args=session._get_current_object())
    emit('my_response', {'data': 'Connected', 'count': 0})

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected', request.sid)

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=80, debug=True)