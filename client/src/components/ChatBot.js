import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I can help you schedule a meeting with Hyun. Please tell me your preferred date and time.\n\nExamples:\n• "I need a 30-minute meeting next Tuesday at 2 PM"\n• "다음 주 화요일 오후 2시에 30분 미팅 잡아주세요"\n• "下周二下午2点安排30分钟的会议"\n• "来週の火曜日午後2時に30分のミーティングをお願いします"\n• "Ich brauche ein 30-minütiges Meeting nächsten Dienstag um 14 Uhr"' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [conversationContext, setConversationContext] = useState({});
  const [userTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Check if this is a confirmation
      if (pendingBooking && (userMessage.toLowerCase().includes('네') || 
          userMessage.toLowerCase().includes('예') || 
          userMessage.toLowerCase().includes('확인') ||
          userMessage.toLowerCase().includes('yes'))) {
        
        // Get user details (in real app, this would be from a form)
        const booking = {
          ...pendingBooking,
          guestEmail: prompt('Please enter your email address:'),
          guestName: prompt('Please enter your name:'),
          purpose: pendingBooking.intent.purpose || 'Meeting'
        };

        const confirmResponse = await fetch('/api/nlp/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });

        const confirmData = await confirmResponse.json();
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: confirmData.message 
        }]);
        setPendingBooking(null);
      } else {
        // Process natural language request with context
        const updatedContext = {
          ...conversationContext,
          previousMessages: messages.slice(-5), // Keep last 5 messages for context
          userTimezone: userTimezone,
          timestamp: new Date().toISOString()
        };
        setConversationContext(updatedContext);
        
        const response = await fetch('/api/nlp/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userMessage,
            timezone: userTimezone,
            context: updatedContext
          })
        });

        const data = await response.json();
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message 
        }]);

        // If confirmation is required, store the booking details
        if (data.confirmationRequired && data.available) {
          setPendingBooking({
            slot: data.slot,
            intent: data.intent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        }

        // Show alternatives if available
        if (data.alternatives && data.alternatives.length > 0) {
          const altMessage = "The following times are available:\n" + 
            data.alternatives.map(alt => `• ${alt.date} ${alt.time}`).join('\n');
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: altMessage 
          }]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, a temporary error occurred. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>🤖 AI Scheduling Assistant</h3>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content loading">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;