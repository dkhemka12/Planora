/**
 * Centralized Error Handling Middleware for Planora
 * Logs technical error details to server console/logs and returns a safe, user-friendly JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  // Log detailed error stack on the server for debugging
  console.error(`[Error] ${req.method} ${req.originalUrl} - Status: ${statusCode}`);
  console.error(err.stack || err);

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error'
  });
};

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404);
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  next(error);
};
