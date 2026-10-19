/**
 * An error that carries the HTTP status to send; the error handler turns it into a JSON response.
 */
export class HttpError extends Error {
  /**
   * @param {number} status - HTTP status code, e.g. 404.
   * @param {string} message - Message shown to the client.
   * @param {unknown} [details] - Optional extra data, such as field-level problems.
   */
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/**
 * @param {string} message - What was wrong with the request.
 * @param {unknown} [details] - Optional field-level problems.
 * @returns {HttpError} A 400 Bad Request error.
 */
export const badRequest = (message, details) => new HttpError(400, message, details);

/**
 * @param {string} [message] - Why authentication failed.
 * @returns {HttpError} A 401 Unauthorized error.
 */
export const unauthorized = (message = 'Authentication required.') => new HttpError(401, message);

/**
 * @param {string} [message] - Why access is denied.
 * @returns {HttpError} A 403 Forbidden error.
 */
export const forbidden = (message = 'You do not have access to this resource.') => new HttpError(403, message);

/**
 * @param {string} [message] - What was not found.
 * @returns {HttpError} A 404 Not Found error.
 */
export const notFound = (message = 'Not found.') => new HttpError(404, message);

/**
 * @param {string} message - What conflicts with existing data.
 * @returns {HttpError} A 409 Conflict error.
 */
export const conflict = (message) => new HttpError(409, message);
