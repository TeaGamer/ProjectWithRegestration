'use client';

import { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getChatHistory, deleteChatMessage } from '../services/chatService';

interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  response: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatProps {
  token?: string;
}

export default function Chat({ token }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Завантажити історію при монтуванні компонента
  useEffect(() => {
    if (token) {
      loadChatHistory();
    }
  }, [token]);

  // Автоматичний скрол до нижу
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    if (!token) return;

    try {
      const history = await getChatHistory(token, 50);
      setMessages(history.messages);
      setError(null);
    } catch (err) {
      setError('Помилка при завантаженні історії');
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !token) {
      setError('Повідомлення не може бути пустим');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(input, token);

      // Додати нове повідомлення до списку
      setMessages([
        ...messages,
        {
          id: response.message_id,
          user_id: 0,
          message: response.user_message,
          response: response.ai_response,
          created_at: response.timestamp,
          updated_at: response.timestamp
        }
      ]);

      setInput('');
    } catch (err) {
      setError((err as Error).message || 'Помилка при відправці повідомлення');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return;

    try {
      await deleteChatMessage(messageId, token);
      setMessages(messages.filter(msg => msg.id !== messageId));
      setError(null);
    } catch (err) {
      setError('Помилка при видаленні повідомлення');
      console.error(err);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Будь ласка, увійдіть щоб використовувати чат</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Заголовок */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <h2>💬 AI Чат</h2>
      </div>

      {/* Сповіщення про помилку */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            textAlign: 'center'
          }}
        >
          {error}
        </div>
      )}

      {/* Повідомлення */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>
            Немає повідомлень. Почніть розмову!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: '1.5rem' }}>
              {/* Повідомлення користувача */}
              <div
                style={{
                  marginBottom: '0.5rem',
                  backgroundColor: '#e3f2fd',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  textAlign: 'right'
                }}
              >
                <strong>Ви:</strong> {msg.message}
              </div>

              {/* Відповідь AI */}
              {msg.response && (
                <div
                  style={{
                    marginBottom: '0.5rem',
                    backgroundColor: '#f5f5f5',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'left'
                  }}
                >
                  <strong>🤖 AI:</strong> {msg.response}
                </div>
              )}

              {/* Кнопка видалення */}
              <button
                onClick={() => handleDeleteMessage(msg.id)}\n                style={{
                  fontSize: '0.75rem',\n                  padding: '0.25rem 0.5rem',\n                  cursor: 'pointer',\n                  backgroundColor: '#fee',\n                  border: 'none',\n                  borderRadius: '4px',\n                  color: '#c00'\n                }}\n              >\n                Видалити\n              </button>\n            </div>\n          ))\n        )}\n        <div ref={messagesEndRef} />\n      </div>\n\n      {/* Форма для відправки */}\n      <form\n        onSubmit={handleSendMessage}\n        style={{\n          display: 'flex',\n          gap: '0.5rem',\n          padding: '1rem',\n          borderTop: '1px solid #ccc'\n        }}\n      >\n        <input\n          type=\"text\"\n          value={input}\n          onChange={(e) => setInput(e.target.value)}\n          placeholder=\"Напишіть повідомлення...\"\n          disabled={loading}\n          style={{\n            flex: 1,\n            padding: '0.75rem',\n            border: '1px solid #ccc',\n            borderRadius: '4px',\n            fontSize: '1rem'\n          }}\n        />\n        <button\n          type=\"submit\"\n          disabled={loading || !input.trim()}\n          style={{\n            padding: '0.75rem 1.5rem',\n            backgroundColor: loading ? '#ccc' : '#007bff',\n            color: 'white',\n            border: 'none',\n            borderRadius: '4px',\n            cursor: loading ? 'not-allowed' : 'pointer',\n            fontSize: '1rem'\n          }}\n        >\n          {loading ? 'Надсилання...' : 'Надіслати'}\n        </button>\n      </form>\n    </div>\n  );\n}\n