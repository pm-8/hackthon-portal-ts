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

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token;
  
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
    return;
  }

  try {
    // FIX: Changed SECRET_KEY to JWT_SECRET to match the auth controller!
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      fullName: decoded.fullName
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
    return;
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `User role '${req.user.role}' is not authorized to access this route` 
      });
      return;
    }
    next();
  };
};