/**
 * Request validation middleware generator
 * Checks that all required fields are present in req.body
 * @param {string[]} requiredFields - Array of field names required in req.body
 */
export const validateBody = (requiredFields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400);
      return next(new Error('Request body must be a valid JSON object'));
    }

    const missing = requiredFields.filter((field) => {
      const val = req.body[field];
      return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
    });

    if (missing.length > 0) {
      res.status(400);
      return next(new Error(`Missing or empty required field(s): ${missing.join(', ')}`));
    }

    next();
  };
};
