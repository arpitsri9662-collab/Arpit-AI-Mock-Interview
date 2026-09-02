import { Router } from 'express';
import { register, login, getMe, updateProfile, updateSettings } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validateRegister, validateLogin, validateProfileUpdate, validateSettingsUpdate } from '../middleware/validation';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', auth, getMe);
router.patch('/profile', auth, validateProfileUpdate, updateProfile);
router.patch('/settings', auth, validateSettingsUpdate, updateSettings);

export default router;
