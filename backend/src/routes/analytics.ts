import { Router, Response } from 'express';
import Interview from '../models/Interview';
import { auth, AuthRequest } from '../middleware/auth';
import { validateAnalyticsUserId, validateInterviewAnalyticsId } from '../middleware/validation';

const router = Router();

router.get('/interview/:id', auth, validateInterviewAnalyticsId, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      res.status(404).json({ message: 'Interview not found' });
      return;
    }
    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const questionsByCategory: Record<string, { total: number; avgScore: number }> = {};

    for (const question of interview.questions) {
      const category = question.category;
      if (!questionsByCategory[category]) {
        questionsByCategory[category] = { total: 0, avgScore: 0 };
      }
      questionsByCategory[category].total++;
      if (question.score !== undefined) {
        questionsByCategory[category].avgScore += question.score;
      }
    }

    for (const category of Object.keys(questionsByCategory)) {
      const data = questionsByCategory[category];
      data.avgScore = Math.round((data.avgScore / data.total) * 10) / 10;
    }

    res.json({
      interviewId: interview._id,
      finalScore: interview.finalScore,
      totalQuestions: interview.questions.length,
      questionsByCategory,
      bodyLanguage: interview.bodyLanguageData,
      duration: interview.duration,
    });
  } catch (error) {
    console.error('Error fetching interview analytics:', error);
    res.status(500).json({ message: 'Error fetching interview analytics', error: String(error) });
  }
});

router.get('/:userId', auth, validateAnalyticsUserId, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.userId !== req.user?.id) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const interviews = await Interview.find({ userId: req.user?.id, status: 'completed' })
      .sort({ createdAt: -1 });

    if (interviews.length === 0) {
      res.json({
        totalInterviews: 0,
        averageScore: 0,
        scoreTrends: [],
        weakAreas: [],
        strongAreas: [],
        recentInterviews: [],
      });
      return;
    }

    const totalScore = interviews.reduce((sum, i) => sum + (i.finalScore || 0), 0);
    const averageScore = totalScore / interviews.length;

    const scoreTrends = interviews.slice(0, 10).map(i => ({
      date: i.completedAt,
      score: i.finalScore,
    }));

    const categoryScores: Record<string, number[]> = {};
    const categoryCounts: Record<string, number> = {};

    for (const interview of interviews) {
      for (const question of interview.questions) {
        const category = question.category;
        if (!categoryScores[category]) {
          categoryScores[category] = [];
          categoryCounts[category] = 0;
        }
        if (question.score !== undefined) {
          categoryScores[category].push(question.score);
          categoryCounts[category]++;
        }
      }
    }

    const weakAreas: string[] = [];
    const strongAreas: string[] = [];

    for (const [category, scores] of Object.entries(categoryScores)) {
      if (scores.length > 0) {
        const avgCategoryScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avgCategoryScore < 3) {
          weakAreas.push(category);
        } else if (avgCategoryScore >= 4) {
          strongAreas.push(category);
        }
      }
    }

    const recentInterviews = interviews.map(i => ({
      id: i._id,
      date: i.completedAt,
      finalScore: i.finalScore,
      questionCount: i.questions.length,
      answeredCount: i.questions.filter(q => q.score !== undefined).length,
      hasRecording: Boolean(i.recordingUrl),
      duration: i.recordingDuration || i.duration * 60,
    }));

    res.json({
      totalInterviews: interviews.length,
      averageScore: Math.round(averageScore * 10) / 10,
      scoreTrends,
      weakAreas,
      strongAreas,
      recentInterviews,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: String(error) });
  }
});

export default router;
