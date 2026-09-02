import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Interview from '../models/Interview';
import { uploadVideoToCloudinary, deleteVideoFromCloudinary } from '../services/cloudinaryService';
import { videoUpload } from '../middleware/upload';

const router = Router();

/**
 * POST /api/demo/upload-recording/:interviewId
 * Upload interview recording to Cloudinary and save URL
 * Body: multipart { recording: File, duration: number } or JSON { videoBase64, duration }
 */
router.post('/upload-recording/:interviewId', auth, videoUpload.single('recording'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params;
    const { videoBase64, duration } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      res.status(404).json({ message: 'Interview not found' });
      return;
    }

    // Verify ownership
    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    let videoBuffer: Buffer | null = req.file?.buffer || null;

    if (!videoBuffer && typeof videoBase64 === 'string') {
      const base64Data = videoBase64.replace(/^data:video\/\w+;base64,/, '');
      videoBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!videoBuffer || videoBuffer.length === 0) {
      res.status(400).json({ message: 'No recording file provided' });
      return;
    }

    const publicId = `interview_${interviewId}_${Date.now()}`;

    console.log(`Uploading recording for interview ${interviewId} (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);

    const result = await uploadVideoToCloudinary(videoBuffer, publicId);

    interview.recordingUrl = result.url;
    interview.recordingPublicId = result.publicId;
    interview.recordingDuration = Number(duration) || result.duration;
    await interview.save();

    console.log(`Recording uploaded: ${result.url}`);

    res.json({
      message: 'Recording uploaded successfully',
      recordingUrl: result.url,
      duration: Number(duration) || result.duration,
    });
  } catch (error) {
    console.error('Error uploading recording:', error);
    res.status(500).json({ message: 'Error uploading recording', error: String(error) });
  }
});

/**
 * POST /api/demo/publish/:interviewId
 * Publish an interview recording so it appears on the demo page
 */
router.post('/publish/:interviewId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      res.status(404).json({ message: 'Interview not found' });
      return;
    }
    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    if (!interview.recordingUrl) {
      res.status(400).json({ message: 'No recording found for this interview' });
      return;
    }

    interview.isPublished = true;
    await interview.save();

    res.json({ message: 'Interview published successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing interview', error: String(error) });
  }
});

/**
 * POST /api/demo/unpublish/:interviewId
 * Unpublish an interview recording
 */
router.post('/unpublish/:interviewId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      res.status(404).json({ message: 'Interview not found' });
      return;
    }
    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    interview.isPublished = false;
    await interview.save();

    res.json({ message: 'Interview unpublished' });
  } catch (error) {
    res.status(500).json({ message: 'Error unpublishing', error: String(error) });
  }
});

/**
 * DELETE /api/demo/recording/:interviewId
 * Delete the recording from Cloudinary and remove URL from DB
 */
router.delete('/recording/:interviewId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      res.status(404).json({ message: 'Interview not found' });
      return;
    }
    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    // Try to delete from Cloudinary
    if (interview.recordingUrl) {
      try {
        let publicId = interview.recordingPublicId;

        if (!publicId) {
          const urlParts = interview.recordingUrl.split('/');
          const fileWithExt = urlParts[urlParts.length - 1];
          const folder = urlParts[urlParts.length - 2];
          publicId = `${folder}/${fileWithExt.split('.')[0]}`;
        }

        await deleteVideoFromCloudinary(publicId);
      } catch (e) {
        console.error('Cloudinary delete failed (continuing):', e);
      }
    }

    interview.recordingUrl = undefined;
    interview.recordingPublicId = undefined;
    interview.recordingDuration = 0;
    interview.isPublished = false;
    await interview.save();

    res.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recording', error: String(error) });
  }
});

/**
 * GET /api/demo/my-recordings
 * Get all recordings of the logged-in user
 */
router.get('/my-recordings', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviews = await Interview.find({
      userId: req.user?.id,
      status: 'completed',
      recordingUrl: { $exists: true, $ne: '' },
    })
      .select('recordingUrl recordingDuration isPublished finalScore questions completedAt createdAt')
      .sort({ completedAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recordings', error: String(error) });
  }
});

/**
 * GET /api/demo/public
 * Get all published demo recordings (NO AUTH - public endpoint)
 */
router.get('/public', async (req, res): Promise<void> => {
  try {
    const demos = await Interview.find({
      isPublished: true,
      recordingUrl: { $exists: true, $ne: '' },
      status: 'completed',
    })
      .populate('userId', 'name')
      .select('recordingUrl recordingDuration finalScore questions userId completedAt createdAt')
      .sort({ completedAt: -1 })
      .limit(20);

    const result = demos.map((d: any) => ({
      id: d._id,
      recordingUrl: d.recordingUrl,
      duration: d.recordingDuration,
      score: d.finalScore,
      questionsCount: d.questions?.length || 0,
      userName: d.userId?.name || 'Anonymous',
      completedAt: d.completedAt,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching demos', error: String(error) });
  }
});

export default router;
