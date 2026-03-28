const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function apiRequest(path, options = {}) {
  const { headers = {}, body, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const message = payload?.error?.message || '요청 처리 중 오류가 발생했습니다.';
    throw new Error(message);
  }

  return payload.data;
}

export { API_BASE_URL };
