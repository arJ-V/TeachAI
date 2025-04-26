from flask import Flask, jsonify
from flask_cors import CORS
import random
import time
import threading

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables
emotions = {
    "neutral": 0,
    "happiness": 0,
    "sadness": 0,
    "surprise": 0,
    "fear": 0,
    "disgust": 0,
    "anger": 0,
    "contempt": 0
}
processing_active = False
processing_thread = None

def simulate_emotion_data():
    """Generate simulated emotion data when real detection isn't available"""
    global emotions
    
    # Randomly select a dominant emotion
    dominant_emotion = random.choice(list(emotions.keys()))
    
    # Generate random values for all emotions
    for emotion in emotions:
        if emotion == dominant_emotion:
            emotions[emotion] = random.randint(60, 100)
        else:
            emotions[emotion] = random.randint(0, 40)
    
    # Print to console for debugging
    print(f"Updated emotions: {emotions}")
    
    return emotions

def processing_thread_function():
    """Background thread for continuous emotion data generation"""
    global processing_active, emotions
    
    print("Emotion processing thread started")
    while processing_active:
        emotions = simulate_emotion_data()
        time.sleep(0.5)  # Update every 500ms
    
    print("Emotion processing thread stopped")

@app.route('/api/start', methods=['GET'])
def start_processing():
    """Start the emotion detection simulation"""
    global processing_active, processing_thread
    
    if processing_active:
        return jsonify({"status": "already_running"})
    
    processing_active = True
    processing_thread = threading.Thread(target=processing_thread_function)
    processing_thread.daemon = True
    processing_thread.start()
    
    return jsonify({"status": "started"})

@app.route('/api/stop', methods=['GET'])
def stop_processing():
    """Stop the emotion detection simulation"""
    global processing_active
    
    if not processing_active:
        return jsonify({"status": "not_running"})
    
    processing_active = False
    if processing_thread and processing_thread.is_alive():
        processing_thread.join(timeout=2.0)
    
    return jsonify({"status": "stopped"})

@app.route('/api/emotions', methods=['GET'])
def get_emotions():
    """Return the latest emotion data"""
    return jsonify(emotions)

@app.route('/', methods=['GET'])
def home():
    return "Emotion Detection Backend API is running!"

if __name__ == '__main__':
    print("Starting Emotion Detection Backend Server...")
    app.run(debug=False, port=5000)
