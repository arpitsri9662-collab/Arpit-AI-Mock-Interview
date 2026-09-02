import { Router } from 'express';
import { uploadResume, analyzeResume, getResume, getUserResumes, deleteResume } from '../controllers/resumeController';
import { auth, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { validateResumeId, validateUserId } from '../middleware/validation';
import { validateFileContent } from '../middleware/fileValidation';

const router = Router();

router.post('/upload', auth, upload.single('resume'), validateFileContent, uploadResume);
router.post('/analyze/:id', auth, validateResumeId, analyzeResume);
router.get('/user/:userId', auth, validateUserId, getUserResumes);
router.get('/:id', auth, validateResumeId, getResume);
router.delete('/:id', auth, validateResumeId, deleteResume);

export default router;
