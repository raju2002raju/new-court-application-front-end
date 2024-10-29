// ChatBot.jsx
import React, { useState, useEffect, useRef } from 'react';

const ChatBot = ({ missingFields = [], onFieldUpdate = () => {} }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, [missingFields]);

  const initializeChat = () => {
    if (!missingFields || missingFields.length === 0) {
      setMessages([{
        type: 'bot',
        content: 'All fields have been filled. Document is complete!'
      }]);
      return;
    }

    // Show first missing field context
    setMessages([{
      type: 'bot',
      content: `Please fill in the following information:\n\n"${missingFields[0].context}"\n\nCurrent blank: ${missingFields[0].value}`
    }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !missingFields || currentFieldIndex >= missingFields.length) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Update the field
      onFieldUpdate(input, currentFieldIndex);

      // Add confirmation message
      const confirmationMessage = {
        type: 'bot',
        content: `Thank you! I've updated the document with: "${input}"`
      };
      setMessages(prev => [...prev, confirmationMessage]);

      // Move to next field if available
      if (currentFieldIndex < missingFields.length - 1) {
        setCurrentFieldIndex(prev => prev + 1);
        
        // Add message for next field after a short delay
        setTimeout(() => {
          const nextFieldMessage = {
            type: 'bot',
            content: `Please fill in the following information:\n\n"${missingFields[currentFieldIndex + 1].context}"\n\nCurrent blank: ${missingFields[currentFieldIndex + 1].value}`
          };
          setMessages(prev => [...prev, nextFieldMessage]);
        }, 500);
      } else {
        // All fields completed
        setTimeout(() => {
          const completionMessage = {
            type: 'bot',
            content: 'All missing information has been filled! The document is now complete.'
          };
          setMessages(prev => [...prev, completionMessage]);
        }, 500);
      }
    } catch (error) {
      // Add error message if update fails
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, there was an error updating the field. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setInput('');
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-[500px] p-3">
         <h3 className='font-bold text-center mt-5'>Welcome to LegalDraft Bot!</h3>
         <p  className='text-center mt-5'>"Hello! I’m here to assist you with creating, editing, and refining legal drafts accurately and efficiently. Whether you’re drafting contracts, agreements, or legal notices, I'm ready to help you streamline your text.</p>
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
                ? "Type your response..."
                : "All fields completed"
            }
            disabled={currentFieldIndex >= missingFields.length}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={currentFieldIndex >= missingFields.length || !input.trim()}
            className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-300 hover:bg-blue-700 transition-colors"
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