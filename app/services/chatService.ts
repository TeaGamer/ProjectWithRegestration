/**
 * Сервіс для взаємодії з AI Chat API
 * Обробляє запити та відповіді чату
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  response: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatResponse {
  message_id: number;
  user_message: string;
  ai_response: string;
  timestamp: string;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
}

/**
 * Відправити повідомлення до AI чату
 */
export async function sendChatMessage(
  message: string,
  token: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Помилка при відправці повідомлення');
    }

    return await response.json();
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}

/**
 * Отримати історію чату
 */
export async function getChatHistory(
  token: string,
  limit: number = 50
): Promise<ChatHistoryResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/api/chat/history`);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Помилка при отриманні історії');
    }

    return await response.json();
  } catch (error) {
    console.error('History error:', error);
    throw error;
  }
}

/**
 * Видалити повідомлення з історії
 */
export async function deleteChatMessage(
  messageId: number,
  token: string
): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Помилка при видаленні повідомлення');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}
