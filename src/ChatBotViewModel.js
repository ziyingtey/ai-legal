import { useState, useCallback, useRef } from 'react';

// Function to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result
        .replace('data:', '')
        .replace(/^.+,/, '');
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Common languages with their codes
const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ms-MY', name: 'Malay' },
];

export function useChatBotViewModel() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: `You said: "${input}"` }]);
    }, 600);
  };

  const handleInputChange = (e) => setInput(e.target.value);
  const handleInputKeyDown = (e) => { if (e.key === 'Enter') handleSend(); };

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    
    if (file.type.startsWith('audio/')) {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('languageCode', selectedLanguage);

      try {
        const response = await fetch('http://localhost:3001/api/speech-to-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to transcribe audio');
        }

        const data = await response.json();
        setMessages(prev => [...prev, 
          { sender: 'user', type: 'audio', text: 'Audio message sent' },
          { sender: 'bot', text: `Transcription: ${data.transcription}` }
        ]);
      } catch (error) {
        console.error('Error transcribing audio:', error);
        setMessages(prev => [...prev, 
          { sender: 'user', type: 'audio', text: 'Audio message sent' },
          { sender: 'bot', text: 'Sorry, I had trouble understanding that audio.' }
        ]);
      }
      return;
    }

    const isImage = file.type.startsWith('image/');
    const fileUrl = URL.createObjectURL(file);
    
    setMessages(prev => [...prev, {
      sender: 'user',
      type: isImage ? 'image' : 'file',
      fileUrl,
      text: `📎 ${isImage ? 'Image' : 'File'}: ${file.name}`
    }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `I received your ${isImage ? 'image' : 'file'}: ${file.name}`
      }]);
    }, 600);
  }, [selectedLanguage]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermissionGranted(true);
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 48000
      });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Add audio message to chat
        setMessages(prev => [...prev, {
          sender: 'user',
          type: 'audio',
          audioUrl,
          text: '🎤 Voice message'
        }]);

        try {
          console.log('Audio blob:', audioBlob);
          console.log('Selected language:', selectedLanguage);
          
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');  // Add filename to help with MIME type
          formData.append('languageCode', selectedLanguage);
          
          const response = await fetch('http://localhost:3001/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Backend response:', data);

          let transcription = '';
          if (data.transcription) {
            // Use direct transcription if available
            transcription = data.transcription;
          } else if (data.results) {
            // Fall back to processing results if provided
            transcription = data.results
              .map(result => result.alternatives[0].transcript)
              .join('\n');
          }

          if (!transcription) {
            throw new Error('No transcription received from backend');
          }

          // Add transcribed text to chat
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: `Transcription: ${transcription}`
          }]);
        } catch (error) {
          console.error('Error transcribing audio:', error);
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: 'Sorry, I had trouble transcribing your audio message.'
          }]);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, [selectedLanguage]);

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
    handleFileUpload,
    startRecording,
    stopRecording,
    selectedLanguage,
    setSelectedLanguage,
    LANGUAGES
  };
}