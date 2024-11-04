import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { baseUrl } from '../Config';

const ChatBot = ({
  templates,
  missingFields = [],
  onFieldUpdate = () => {},
  correctedText = ''
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [documentSections, setDocumentSections] = useState({});
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [documentText, setDocumentText] = useState(correctedText);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentTranscript += transcript + ' ';
          } else {
            currentTranscript += transcript;
          }
        }
    
        transcriptRef.current = currentTranscript;
        
        const formattedText = formatLegalText(currentTranscript);
        setInput(formattedText);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `Speech recognition error: ${event.error}`
        }]);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const formatLegalText = (text) => {
    try {
      let formattedText = '';
      const lines = text.split('.');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Format as plain text instead of JSON
          if (trimmedLine.toLowerCase().includes('case')) {
            formattedText += `${trimmedLine}\n\n`;
          } else if (trimmedLine.toLowerCase().includes('court')) {
            formattedText += `${trimmedLine}\n\n`;
          } else if (trimmedLine.toLowerCase().includes('petition')) {
            formattedText += `${trimmedLine}\n\n`;
          } else if (trimmedLine.toLowerCase().includes('versus')) {
            formattedText += `Versus\n\n`;
          } else if (trimmedLine.toLowerCase().includes('petitioner')) {
            const name = trimmedLine.replace(/.*?name.*?:/i, '').trim();
            formattedText += `${name},\n`;
          } else if (trimmedLine.toLowerCase().includes('father')) {
            formattedText += `${trimmedLine},\n`;
          } else if (trimmedLine.toLowerCase().includes('age')) {
            formattedText += `${trimmedLine},\n`;
          } else if (trimmedLine.toLowerCase().includes('resid')) {
            formattedText += `${trimmedLine}\n\n`;
          } else if (trimmedLine.toLowerCase().includes('respondent')) {
            const name = trimmedLine.replace(/.*?name.*?:/i, '').trim();
            formattedText += `${name},\n`;
          } else {
            formattedText += `${trimmedLine}\n`;
          }
        }
      });
      
      return formattedText;
    } catch (e) {
      console.log('Text formatting error:', e);
      return text;
    }
  };

  // Initialize document with sections
  useEffect(() => {
    const processInitialDocument = async () => {
      if (!correctedText) return;
      
      try {
        // Send initial document for processing only once
        const response = await axios.post(`${baseUrl}/api/process-document`, {
          documentText: correctedText,
          isInitialProcess: true
        });

        if (response.data.success) {
          // Store the document sections received from backend
          setDocumentSections(response.data.sections || {});
        } else {
          throw new Error(response.data.message || 'Failed to process document');
        }
      } catch (error) {
        console.error('Error processing initial document:', error);
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `Error processing document: ${error.message}`
        }]);
      }
    };

    processInitialDocument();
  }, [correctedText]);

  
  // Modified sections of ChatBot.jsx

  const updateDocumentSection = async (userInput, questionContext) => {
    try {
        console.log('Sending update request with:', {
            userInput,
            questionContext,
            documentText
        });

        if (!userInput || !questionContext) {
            throw new Error('Missing required input or question context');
        }

        const response = await axios.post(`${baseUrl}/api/update-section`, {
            userInput,
            questionContext,
            documentText: documentText // Send the current document text
        });

        if (response.data.success) {
            // Update local state with new document text
            setDocumentText(response.data.updatedContent);
            return true;
        } else {
            throw new Error(response.data.message || 'Failed to update section');
        }
    } catch (error) {
        console.error('Error updating section:', error);
        const errorMessage = error.response?.data?.message || error.message;
        setMessages(prev => [...prev, {
            type: 'bot',
            content: `Error updating document section: ${errorMessage}`
        }]);
        return false;
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !missingFields || currentFieldIndex >= missingFields.length) return;

    const currentQuestion = missingFields[currentFieldIndex];
    
    setMessages(prev => [...prev, {
        type: 'user',
        content: input
    }]);

    try {
        console.log('Submitting update with:', {
            input,
            currentQuestion
        });

        const updateSuccess = await updateDocumentSection(
            input,
            currentQuestion.context
        );
        
        if (updateSuccess) {
            // Call the parent component's update function with new document text
            onFieldUpdate(documentText, currentFieldIndex);
            
            setMessages(prev => [...prev, {
                type: 'bot',
                content: `Thank you! I've updated the document with: "${input}"`
            }]);

            handleNextField();
        }
    } catch (error) {
        console.error('Error in handleSubmit:', error);
        setMessages(prev => [...prev, {
            type: 'bot',
            content: 'Sorry, there was an error updating the field. Please try again.'
        }]);
    }

    setInput('');
};


  const startRecording = async () => {
    try {
      // Clear previous transcript when starting new recording
      transcriptRef.current = '';
      setInput('');

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 44100
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        await handleAudioSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(200);
      setIsRecording(true);
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Recording started... Speak now and click the button again to stop.'
      }]);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Error accessing microphone. Please check your permissions.'
      }]);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async (blob) => {
    const fileName = `recording-${Date.now()}.wav`;
    const audioFile = new File([blob], fileName, {
      type: 'audio/webm',
      lastModified: Date.now()
    });
  
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('templateText', missingFields[currentFieldIndex].context);
  
    try {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Processing your audio...'
      }]);
  
      const response = await axios.post(`${baseUrl}/api/ai-audio-update`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
  
      if (response.data.success) {
        onFieldUpdate(response.data.correctedText, currentFieldIndex);
        
        setMessages(prev => [
          ...prev,
          {
            type: 'user',
            content: response.data.correctedText
          },
          {
            type: 'bot',
            content: `Thank you! I've updated the document with: "${response.data.correctedText}"`
          }
        ]);
  
        handleNextField();
      } else {
        throw new Error(response.data.message || 'Error processing audio');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `Error: ${error.message || 'There was an error processing your audio. Please try again.'}`
      }]);
    }
  };

  const initializeChat = async () => {
    if (!missingFields || missingFields.length === 0) {
      setMessages([{
        type: 'bot',
        content: 'All fields have been filled. Document is complete!'
      }]);
      return;
    }

    try {
      // Get the first question from the backend
      const response = await axios.post(`${baseUrl}/api/process-document`, {
        documentText: correctedText,
        currentQuestionIndex: 0
      });

      if (response.data.success && response.data.question) {
        setMessages([{
          type: 'bot',
          content: `${response.data.question}`
        }]);
      } else {
        throw new Error('Failed to get question from backend');
      }
    } catch (error) {
      console.error('Error getting question:', error);
      setMessages([{
        type: 'bot',
        content: 'Error loading question. Please try again.'
      }]);
    }
  };

  const handleNextField = async () => {
    if (currentFieldIndex < missingFields.length - 1) {
      const nextIndex = currentFieldIndex + 1;
      setCurrentFieldIndex(nextIndex);
      
      try {
        // Get the next question from the backend
        const response = await axios.post(`${baseUrl}/api/process-document`, {
          documentText: correctedText,
          currentQuestionIndex: nextIndex
        });

        if (response.data.success && response.data.question) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              type: 'bot',
              content: `${response.data.question}\n\nYou can type or use the microphone to record your response.`
            }]);
          }, 500);
        } else {
          throw new Error('Failed to get next question');
        }
      } catch (error) {
        console.error('Error getting next question:', error);
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Error loading next question. Please try again.'
        }]);
      }
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'All missing information has been filled! The document is now complete.'
        }]);
      }, 500);
    }
  };

  useEffect(() => {
    initializeChat();
  }, [missingFields]);


  return (
    <div className="flex flex-col h-[500px] p-3">
      <h3 className="font-bold text-center mt-5">Welcome to LegalDraft Bot!</h3>
      <p className="text-center mt-5">
        Hello! I'm here to assist you with creating, editing, and refining legal drafts accurately and efficiently. 
        You can type or speak your responses.
      </p>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentFieldIndex < missingFields.length
                ? isRecording 
                  ? "Speaking..."
                  : "Type your response or click the microphone to speak"
                : "All fields completed"
            }
            disabled={currentFieldIndex >= missingFields.length}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={currentFieldIndex >= missingFields.length}
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-600' : 'bg-blue-600'
            } text-white disabled:bg-gray-300 hover:opacity-90 transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isRecording 
                  ? "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M16 12H8" 
                  : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} 
              />
            </svg>
          </button>
          <button
            type="submit"
            disabled={currentFieldIndex >= missingFields.length || !input.trim() || isRecording}
            className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-300 hover:opacity-90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;