'use client';

import { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getChatHistory, deleteChatMessage } from '../services/chatService';
import styles from '../css/Chat.css'; // Імпорт окремого файлу стилів

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

  // Автоматичний скрол донизу
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

    const trimmedInput = input.trim();
    if (!trimmedInput || !token) return;

    setLoading(true);
    setError(null);
    setInput('');

    // Оптимістичний UI
    const temporaryId = Date.now();
    const optimisticMessage: ChatMessage = {
      id: temporaryId,
      user_id: 0,
      message: trimmedInput,
      response: '...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await sendChatMessage(trimmedInput, token);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === temporaryId
            ? {
                id: response.message_id,
                user_id: 0,
                message: response.user_message,
                response: response.ai_response,
                created_at: response.timestamp,
                updated_at: response.timestamp,
              }
            : msg
        )
      );
    } catch (err) {
      setError((err as Error).message || 'Помилка при відправці повідомлення');
      setMessages((prev) => prev.filter((msg) => msg.id !== temporaryId));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return;

    try {
      await deleteChatMessage(messageId, token);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setError(null);
    } catch (err) {
      setError('Помилка при видаленні повідомлення');
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (error) setError(null);
  };

  if (!token) {
    return (
      <div className = {styles.unauthorizedContainer}>
        <p> Log in to use the chat. </p>
      </div>
    );
  }

  return (
    <div className = {styles.chatContainer}>
      {/* Заголовок */}
      <div className = {styles.header}>
        <h2> 💬 AI Chat </h2>
      </div>

      {/* Сповіщення про помилку */}
      {error && <div className = {styles.errorNotification}>{error}</div>}

      {/* Повідомлення */}
      <div className = {styles.messagesContainer}>
        {messages.length === 0 ? (
          <p className = {styles.emptyMessage}> There are no messages. Rozpocznij rozmowę! </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className = {styles.messageWrapper}>
              {/* Повідомлення користувача */}
              <div className = {styles.userMessage}>
                <strong> You: </strong> {msg.message}
              </div>

              {/* Відповідь AI */}
              {msg.response && (
                <div className = {styles.aiMessage}>
                  <strong> Alex: </strong> {msg.response}
                </div>
              )}

              {/* Кнопка видалення */}
              <button
                onClick = {() => handleDeleteMessage(msg.id)}
                className = {styles.deleteButton}
              >
                Remove
              </button>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма для відправки */}
      <form onSubmit={handleSendMessage} className = {styles.form}>
        <input
          type = "text"
          value = {input}
          onChange={handleInputChange}
          placeholder=" Write a message...) "
          disabled={loading}
          className = {styles.input}
        />

        <button
          type = "submit"
          disabled={loading || !input.trim()}
          className = {styles.submitButton}
        >
          {loading ? ' Sending... ' : ' Send '}
        </button>
      </form>
    </div>
  );
}