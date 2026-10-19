/**
 * Error thrown for any failed API call; carries the HTTP status and the server's details.
 */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let authToken = null;
let onUnauthorized = () => {};

/**
 * Sets the token sent as `Authorization: Bearer` on every request.
 * @param {string | null} token - The signed-in user's token, or null when signed out.
 */
export const setAuthToken = (token) => {
  authToken = token;
};

/**
 * Sets the function called when the API rejects the current token (HTTP 401).
 * @param {() => void} handler - Usually signs the user out.
 */
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

/**
 * Calls the API with the current token, sending `body` as JSON (or as-is for FormData).
 * @param {string} path - API path, e.g. `/api/products`.
 * @param {{method?: string, body?: unknown, signal?: AbortSignal}} [options]
 * @returns {Promise<{data: unknown, headers: Headers}>} Parsed response body and headers.
 * @throws {ApiError} When the response status is not 2xx, with the server's message.
 */
export const request = async (path, { method = 'GET', body, signal } = {}) => {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  const type = res.headers.get('content-type') ?? '';
  const data = type.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401 && authToken) onUnauthorized();
    const message = (typeof data === 'object' && data?.message) || res.statusText || 'Request failed';
    const details = typeof data === 'object' ? data?.details : undefined;
    throw new ApiError(res.status, message, details);
  }
  return { data, headers: res.headers };
};

/**
 * Shortcuts for common HTTP methods; each resolves to the response body only.
 */
export const api = {
  get: (path, opts) => request(path, opts).then((r) => r.data),
  post: (path, body) => request(path, { method: 'POST', body }).then((r) => r.data),
  put: (path, body) => request(path, { method: 'PUT', body }).then((r) => r.data),
  delete: (path) => request(path, { method: 'DELETE' }).then((r) => r.data),
};

/**
 * Picks the message to show the user for an error.
 * @param {unknown} error - Usually an ApiError.
 * @returns {string} The first validation detail if present, else the error message.
 */
export const errorText = (error) => error?.details?.[0]?.message ?? error?.message ?? 'Something went wrong.';
