
import React, { useState, useEffect, useRef } from 'react';
import { getChatHistory, sendChatMessage, deleteChatMessage } from '../services/chatService';

interface Message {
  id: number;
  user_id: number;
  message: string;
  response: string | null;
  created_at: string;
  updated_at: string;
}

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Завантажити історію при монтуванні компонента
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Автоскрол до останнього повідомлення
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      setError(null);
      // Token передається автоматично через HttpOnly cookie з credentials: 'include'
      const history = await getChatHistory('', 50);
      setMessages(history.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження історії');
      console.error('Помилка:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    const userMessage = input;
    setInput('');

    try {
      const response = await sendChatMessage(userMessage, '');

      setMessages(prev => [...prev, {
        id: response.message_id,
        user_id: 0,
        message: response.user_message,
        response: response.ai_response,
        created_at: response.timestamp,
        updated_at: response.timestamp
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка відправки повідомлення');
      setInput(userMessage); // Повернути текст у поле вводу
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      // Token передається автоматично через HttpOnly cookie з credentials: 'include'
      await deleteChatMessage(messageId, '');
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка видалення');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Повідомлення */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {messages.length === 0 ? (
          <p>Немає повідомлень. Почніть розмову!</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: '15px' }}>
              <div style={{ 
                backgroundColor: '#e3f2fd', 
                padding: '8px', 
                borderRadius: '8px',
                marginBottom: '5px'
              }}>
                <strong>Ви:</strong> {msg.message}
              </div>
              {msg.response && (
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '8px',
                  marginBottom: '5px'
                }}>
                  <strong>ШІ:</strong> {msg.response}
                </div>
              )}
              <button 
                onClick={() => handleDeleteMessage(msg.id)}
                style={{ fontSize: '12px', color: 'red' }}
              >
                Видалити
              </button>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Помилка */}
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px',
          marginBottom: '10px'
        }}>
          ❌ {error}
        </div>
      )}
{/* Форма вводу */}
      <form onSubmit={handleSendMessage} style={{ padding: '10px', display: 'flex', gap: '5px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишіть повідомлення..."
          disabled={loading}
          style={{ 
            flex: 1, 
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳...' : 'Відправити'}
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;