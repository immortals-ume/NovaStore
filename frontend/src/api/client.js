export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let authToken = null;
let onUnauthorized = () => {};

export const setAuthToken = (token) => {
  authToken = token;
};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

/** Calls the API and returns `{ data, headers }`; failures throw an ApiError with the server's message. */
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

export const api = {
  get: (path, opts) => request(path, opts).then((r) => r.data),
  post: (path, body) => request(path, { method: 'POST', body }).then((r) => r.data),
  put: (path, body) => request(path, { method: 'PUT', body }).then((r) => r.data),
  delete: (path) => request(path, { method: 'DELETE' }).then((r) => r.data),
};

/** First validation detail if present, else the error message. */
export const errorText = (error) => error?.details?.[0]?.message ?? error?.message ?? 'Something went wrong.';
