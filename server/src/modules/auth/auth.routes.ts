import { Router } from 'express'
import { authController } from './auth.controller'
import { requireAuth, requireAdmin } from './auth.middleware'

const router = Router()

router.post('/login', authController.login)
router.get('/me', requireAuth, authController.me)
router.put('/me', requireAuth, authController.updateProfile)
router.post('/change-password', requireAuth, authController.changePassword)

router.get('/users', requireAuth, requireAdmin, authController.list)
router.post('/users', requireAuth, requireAdmin, authController.create)
router.put('/users/:id', requireAuth, requireAdmin, authController.update)
router.delete('/users/:id', requireAuth, requireAdmin, authController.remove)

export default router
