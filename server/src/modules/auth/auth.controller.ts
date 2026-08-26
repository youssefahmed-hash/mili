import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import { successResponse } from '../../utils/apiResponse'
import { AuthRequest } from './auth.middleware'

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body)
      return successResponse(res, user, 'تم إنشاء الحساب بنجاح', 201)
    } catch (err) {
      next(err)
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body
      const result = await authService.login(username, password)
      return successResponse(res, result, 'تم تسجيل الدخول بنجاح')
    } catch (err) {
      next(err)
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getById(req.user!.id)
      return successResponse(res, user, 'تم جلب بيانات المستخدم')
    } catch (err) {
      next(err)
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.list()
      return successResponse(res, users, 'تم جلب المستخدمين')
    } catch (err) {
      next(err)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body)
      return successResponse(res, user, 'تم إنشاء المستخدم بنجاح', 201)
    } catch (err) {
      next(err)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.update(req.params.id, req.body)
      return successResponse(res, user, 'تم تحديث بيانات المستخدم')
    } catch (err) {
      next(err)
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.delete(req.params.id)
      return successResponse(res, null, 'تم حذف المستخدم')
    } catch (err) {
      next(err)
    }
  }
}

export const authController = new AuthController()
