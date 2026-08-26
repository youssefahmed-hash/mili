import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mili_jwt_secret_2024'

export interface AuthRequest extends Request {
  user?: { id: string; username: string; role: string }
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'غير مصرح بالدخول' })
    return
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string
      username: string
      role: string
    }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: 'جلسة غير صالحة' })
  }
}

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'صلاحية المدير مطلوبة' })
    return
  }
  next()
}
