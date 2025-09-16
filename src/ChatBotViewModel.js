import { useState, useCallback, useRef } from 'react';

export function useChatBotViewModel() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  
  const handleFileUpload = useCallback((file) => {
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const fileUrl = URL.createObjectURL(file);
    
    setMessages(prev => [...prev, {
      sender: 'user',
      type: isImage ? 'image' : 'file',
      fileUrl,
      text: `📎 ${isImage ? 'Image' : 'File'}: ${file.name}`
    }]);

    // Mock AI response for file upload
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `I received your ${isImage ? 'image' : 'file'}: ${file.name}`
      }]);
    }, 600);
  }, []);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');
    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: `You said: "${input}"` }]);
    }, 600);
  };

  const handleInputChange = (e) => setInput(e.target.value);
  const handleInputKeyDown = (e) => { if (e.key === 'Enter') handleSend(); };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermissionGranted(true);
      
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Add audio message to chat
        setMessages(prev => [...prev, {
          sender: 'user',
          type: 'audio',
          audioUrl,
          text: '🎤 Voice message'
        }]);

        // Mock AI response after voice message
        setTimeout(() => {
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: 'I received your voice message!'
          }]);
        }, 600);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    messages,
    input,
    isRecording,
    audioPermissionGranted,
    handleSend,
    handleInputChange,
    handleInputKeyDown,
    startRecording,
    stopRecording,
    handleFileUpload
  };
}
