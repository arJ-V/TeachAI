from flask import Flask, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import tempfile
import os
import time
import threading
import json
from contextlib import contextmanager

# Replace with the correct library if needed
try:
    import libreface
    LIBREFACE_AVAILABLE = True
except ImportError:
    print("Warning: libreface library not found. Using simulated emotion data.")
    LIBREFACE_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables for emotion data
latest_emotions = {
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

@contextmanager
def camera_capture(camera_index=0):
    """Context manager for handling camera resources properly"""
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open camera at index {camera_index}")
    try:
        yield cap
    finally:
        cap.release()

def simulate_emotion_data():
    """Generate simulated emotion data when libreface is not available"""
    import random
    
    # Randomly select a dominant emotion
    dominant_emotion = random.choice(list(latest_emotions.keys()))
    
    # Generate random values for all emotions
    for emotion in latest_emotions:
        if emotion == dominant_emotion:
            latest_emotions[emotion] = random.randint(60, 100)
        else:
            latest_emotions[emotion] = random.randint(0, 40)
    
    return latest_emotions

def process_frame(frame):
    """Process a single frame to detect emotions"""
    if not LIBREFACE_AVAILABLE:
        return simulate_emotion_data()
    
    try:
        # Save frame to temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_img:
            img_path = temp_img.name
            cv2.imwrite(img_path, frame)
        
        # Process with libreface
        results = libreface.get_facial_attributes(img_path, batch_size=32, num_workers=2, device="cpu")
        
        # Clean up
        if os.path.exists(img_path):
            os.unlink(img_path)
        
        # Extract emotion data from results
        # Note: This needs to be adjusted based on actual libreface API
        if results and len(results) > 0:
            emotions = results[0].get('emotions', {})
            for emotion in latest_emotions:
                if emotion in emotions:
                    latest_emotions[emotion] = int(emotions[emotion] * 100)
        
        return latest_emotions
    
    except Exception as e:
        print(f"Error processing frame: {e}")
        return simulate_emotion_data()

def video_processing_thread():
    """Background thread for continuous video processing"""
    global processing_active, latest_emotions
    
    try:
        with camera_capture(0) as cap:
            while processing_active:
                ret, frame = cap.read()
                if not ret:
                    continue
                
                # Process frame to get emotion data
                latest_emotions = process_frame(frame)
                
                # Sleep briefly to control processing rate
                time.sleep(0.5)
    
    except Exception as e:
        print(f"Error in video processing thread: {e}")
        processing_active = False

@app.route('/api/start', methods=['GET'])
def start_processing():
    """Start the background video processing"""
    global processing_active, processing_thread
    
    if processing_active:
        return jsonify({"status": "already_running"})
    
    processing_active = True
    processing_thread = threading.Thread(target=video_processing_thread)
    processing_thread.daemon = True
    processing_thread.start()
    
    return jsonify({"status": "started"})

@app.route('/api/stop', methods=['GET'])
def stop_processing():
    """Stop the background video processing"""
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
    return jsonify(latest_emotions)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
