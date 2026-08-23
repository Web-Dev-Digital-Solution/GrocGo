import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'grocgo-dev-secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    storeId?: string | null;
  };
}

// ─── AUTHENTICATE JWT ────────────────────────────────────────
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── REQUIRE ROLE ────────────────────────────────────────────
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// ─── REQUIRE STORE ACCESS ────────────────────────────────────
export function requireStoreAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  // Super admins can access any store
  if (req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }
  // Others must have a storeId
  if (!req.user.storeId) {
    res.status(403).json({ error: 'No store associated with this account' });
    return;
  }
  next();
}

// ─── GENERATE JWT TOKEN ─────────────────────────────────────
export function generateToken(user: { id: string; email: string; role: string; storeId?: string | null }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, storeId: user.storeId },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );
}
