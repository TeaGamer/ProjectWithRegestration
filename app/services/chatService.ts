/**
 * Сервіс для взаємодії з AI Chat API
 * Обробляє запити та відповіді чату
 */

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

function getCsrfHeaders(): Record<string, string> {
  const csrfToken = document.cookie
    .split("; ")
    .find((item) => item.startsWith("csrf_token="))
    ?.split("=")[1];
  return csrfToken ? { "X-CSRF-Token": decodeURIComponent(csrfToken) } : {};
}

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
  files?: File[]
): Promise<ChatResponse> {
  try {
    let requestBody: BodyInit;
    if (files?.length) {
      const formData = new FormData();
      formData.append('message', message);
      files.forEach((file) => formData.append('files', file, file.name));
      requestBody = formData;
    } else {
      requestBody = JSON.stringify({ message });
    }

    console.log('Sending chat message with token:', token ? 'Present' : 'Missing');
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        ...(files?.length ? {} : { 'Content-Type': 'application/json' }),
        ...getCsrfHeaders(),
      },
      credentials: 'include',
      body: requestBody
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || `Error sending message: ${response.status}`);
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
      headers: getCsrfHeaders(),
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
      headers: getCsrfHeaders(),
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
  text: string
): Promise<ParsedEvent> {
  const response = await fetch(`${API_BASE_URL}/api/chat/parse-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        ...getCsrfHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error('Failed to parse the event from the text');
  }

  return response.json();
}

const chatService = {
  sendMessage: sendChatMessage,
  getHistory: getChatHistory,
  deleteMessage: deleteChatMessage,
};

export default chatService;