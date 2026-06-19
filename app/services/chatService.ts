/**
 * Сервіс для взаємодії з AI Chat API
 * Обробляє запити та відповіді чату
 */

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
/**
 * Типи даних для повідомлень чату та відповідей
 */
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
  token: string,
  fileNames?: string[]
): Promise<ChatResponse> {
  try {
    const payload: { message: string; fileNames?: string[] } = { message };
    if (fileNames && fileNames.length > 0) {
      payload.fileNames = fileNames;
    }

    console.log('Sending chat message with token:', token ? 'Present' : 'Missing');
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error sending message: ${response.status}`);
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

    console.log('Fetching chat history with token:', token ? 'Present' : 'Missing');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error fetching history: ${response.status}`);
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
    console.log('Deleting message with token:', token ? 'Present' : 'Missing');

    const response = await fetch(`${API_BASE_URL}/api/chat/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error deleting message: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}
// Додати перед "export default {"

export interface ParsedEvent {
  is_event: boolean;
  title?: string;
  date?: string;
  time?: string;
  category?: string;
}

export async function parseEventFromText(
  text: string,
  token: string
): Promise<ParsedEvent> {
  const response = await fetch(`${API_BASE_URL}/api/chat/parse-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error('Не вдалося розпарсити подію');
  }

  return response.json();
}

export default {
  sendMessage: sendChatMessage,
  getHistory: getChatHistory,
  deleteMessage: deleteChatMessage,
};