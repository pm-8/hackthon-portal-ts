import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model.js';
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    fullName: string;
  };
}
export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as any;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      fullName: decoded.fullName
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};