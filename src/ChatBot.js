import React, { useState, useRef } from 'react';
import './ChatBot.css';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

function ChatBot({ 
  messages, 
  input, 
  isRecording,
  handleSend, 
  handleInputChange, 
  handleInputKeyDown,
  startRecording,
  stopRecording,
  handleFileUpload
}) {
  // Scroll to bottom when messages change
  const messagesEndRef = React.useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  React.useEffect(scrollToBottom, [messages]);

  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsWebcamOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'webcam-capture.png', { type: 'image/png' });
        handleFileUpload(file);
        stopWebcam();
      }, 'image/png');
    }
  };
  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatbot-message chatbot-message-${msg.sender}`}>
            {msg.type === 'audio' ? (
              <div className="audio-message">
                <audio controls src={msg.audioUrl} />
                <span>{msg.text}</span>
              </div>
            ) : msg.type === 'image' ? (
              <div className="image-message">
                <img src={msg.fileUrl} alt="Uploaded" />
                <span>{msg.text}</span>
              </div>
            ) : msg.type === 'file' ? (
              <div className="file-message">
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">{msg.text}</a>
              </div>
            ) : (
              msg.text
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-input-row">
        <input 
          type="file" 
          id="file-upload" 
          style={{ display: 'none' }} 
          onChange={(e) => handleFileUpload(e.target.files[0])}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Dialog 
          open={isWebcamOpen} 
          onClose={stopWebcam}
          maxWidth="md"
        >
          <DialogContent>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxWidth: '640px' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={stopWebcam} color="primary">
              Cancel
            </Button>
            <Button onClick={capturePhoto} color="primary" variant="contained">
              Take Photo
            </Button>
          </DialogActions>
        </Dialog>
        <div className="chatbot-actions">
          <Tooltip title="Attach File">
            <IconButton 
              color="primary" 
              onClick={() => document.getElementById('file-upload').click()}
            >
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
        </div>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Type your message..."
        />
        <IconButton
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop Recording" : "Start Recording"}
          color={isRecording ? "error" : "primary"}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </IconButton>
        <IconButton 
          color="primary" 
          onClick={handleSend}
          title="Send Message"
        >
          <SendIcon />
        </IconButton>
        
      </div>
    </div>
  );
}

export default ChatBot;
