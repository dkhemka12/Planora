import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware for protected routes
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded; // { id, email, name }
      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('Not authorized, token invalid or expired'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }
};
