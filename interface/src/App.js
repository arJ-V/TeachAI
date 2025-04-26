import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadedImage(URL.createObjectURL(file));
    }
  };

  // Upload file for emotion analysis
  const uploadFile = () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch('http://127.0.0.1:5000/api/upload', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setEmotions(data.emotions);
          setError(null);
        } else {
          setError(data.error || 'Error analyzing the image');
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        setError('Failed to upload and analyze the image');
      });
  };

  // Get emotions from backend
  const getEmotions = () => {
    fetch('http://127.0.0.1:5000/api/emotions')
      .then(response => response.json())
      .then(data => {
        setEmotions(data);
      })
      .catch(error => {
        console.error('Error fetching emotions:', error);
      });
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

  // Find the dominant emotion
  const dominantEmotion = Object.entries(emotions).reduce(
    (max, [emotion, value]) => (value > max.value ? { emotion, value } : max),
    { emotion: 'neutral', value: 0 }
  );

  return (
    <div className="App">
      <h1>Emotion Detection App</h1>
      {error && <div className="error-message">{error}</div>}
      
      <div className="container">
        <div className="image-container">
          <h2>Image Upload</h2>
          <div className="upload-section">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              id="file-upload"
            />
            <button 
              onClick={uploadFile} 
              disabled={!selectedFile}
            >
              Analyze Image
            </button>
            {uploadedImage && (
              <div className="preview-container">
                <h4>Preview</h4>
                <img src={uploadedImage} alt="Preview" className="image-preview" />
              </div>
            )}
          </div>
          {dominantEmotion.value > 0 && (
            <div className="dominant-emotion">
              Dominant Emotion: <strong>{dominantEmotion.emotion.charAt(0).toUpperCase() + dominantEmotion.emotion.slice(1)}</strong>
            </div>
          )}
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
    </div>
  );
}

export default App;
