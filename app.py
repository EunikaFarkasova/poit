from flask import Flask, render_template, session, request, jsonify, url_for, send_from_directory
from flask_socketio import SocketIO, emit, disconnect    
import time

async_mode = None

app = Flask(__name__)

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock() 

@app.route('/')
def index():
    return render_template('index.html', async_mode=socketio.async_mode)