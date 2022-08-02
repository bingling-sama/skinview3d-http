from flask import Flask, request
import requests

app = Flask(__name__)

@app.route('/api/')
def hello_world():
    return 'Hello'