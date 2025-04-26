import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [notes, setNotes] = useState('');
  const [emotions, setEmotions] = useState({
    neutral: 0,
    happiness: 0,
    sadness: 0,
    surprise: 0,
    fear: 0,
    disgust: 0,
    anger: 0,
    contempt: 0
  });
  const [processingStatus, setProcessingStatus] = useState('stopped');
  const [error, setError] = useState(null);
  const [simulationInterval, setSimulationInterval] = useState(null);

  // Predefined function to stop emotion detection
  const stopEmotionDetection = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setProcessingStatus('stopped');
  };

  // Initialize webcam
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing the webcam: ", err);
          setError("Failed to access webcam. Please ensure you have a webcam connected and have granted permission to use it.");
        });
    }

    // Clean up on component unmount
    return () => {
      stopEmotionDetection();
    };
  }, [simulationInterval]); // Add simulationInterval as a dependency

  // Simulate emotion detection (for demo purposes)
  const simulateEmotionDetection = () => {
    // Randomly select a dominant emotion
    const emotionList = Object.keys(emotions);
    const dominantEmotion = emotionList[Math.floor(Math.random() * emotionList.length)];
    
    // Generate random values for all emotions
    const newEmotions = {};
    emotionList.forEach(emotion => {
      if (emotion === dominantEmotion) {
        newEmotions[emotion] = Math.floor(Math.random() * 40) + 60; // 60-100 range for dominant
      } else {
        newEmotions[emotion] = Math.floor(Math.random() * 40); // 0-39 range for others
      }
    });
    
    setEmotions(newEmotions);
  };

  const startEmotionDetection = () => {
    if (processingStatus === 'running') return;
    
    // Start the simulation interval
    const interval = setInterval(simulateEmotionDetection, 500);
    setSimulationInterval(interval);
    setProcessingStatus('running');
  };

  const handleEmotionChange = (emotion, value) => {
    setEmotions(prev => ({
      ...prev,
      [emotion]: value
    }));
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const toggleProcessing = () => {
    if (processingStatus === 'running') {
      stopEmotionDetection();
    } else {
      startEmotionDetection();
    }
  };

  // Find the dominant emotion
  const dominantEmotion = Object.entries(emotions).reduce(
    (max, [emotion, value]) => (value > max.value ? { emotion, value } : max),
    { emotion: 'neutral', value: 0 }
  );

  // Instructions for integrating Python backend
  const pythonIntegrationInstructions = `
  To integrate the Python backend:
  
  1. Install required packages in a virtual environment:
     python -m venv venv
     source venv/bin/activate  # On Windows: venv\\Scripts\\activate
     pip install flask flask-cors opencv-python numpy
  
  2. Save your Python code to 'backend/app.py'
  
  3. Modify the React code to use API endpoints:
     - Uncomment the API fetch code
     - Comment out the simulation code
  
  4. Run the backend server:
     python backend/app.py
  `;

  return (
    <div className="App">
      <h1>Emotion Detection App</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="status-bar">
        <span>Status: {processingStatus === 'running' ? 'Running' : 'Stopped'}</span>
        <button onClick={toggleProcessing}>
          {processingStatus === 'running' ? 'Stop Detection' : 'Start Detection'}
        </button>
      </div>
      <div className="container">
        <div className="video-container">
          <h2>Video Feed</h2>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
          />
          <div className="dominant-emotion">
            Dominant Emotion: <strong>{dominantEmotion.emotion.charAt(0).toUpperCase() + dominantEmotion.emotion.slice(1)}</strong>
          </div>
        </div>
        <div className="emotions-container">
          <h2>Emotion Levels</h2>
          {Object.keys(emotions).map(emotion => (
            <div key={emotion} className="emotion-slider">
              <label htmlFor={emotion}>
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}: {emotions[emotion]}
              </label>
              <input
                type="range"
                id={emotion}
                min="0"
                max="100"
                value={emotions[emotion]}
                onChange={(e) => handleEmotionChange(emotion, parseInt(e.target.value))}
                disabled={processingStatus === 'running'}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="notes-container">
        <h2>Notes & Observations</h2>
        <textarea
          rows="6"
          placeholder="Enter your notes and observations here..."
          value={notes}
          onChange={handleNotesChange}
        />
      </div>
      
      <div className="integration-info">
        <h3>Python Backend Integration</h3>
        <details>
          <summary>Click to view integration instructions</summary>
          <pre>{pythonIntegrationInstructions}</pre>
        </details>
      </div>
    </div>
  );
}

export default App;
