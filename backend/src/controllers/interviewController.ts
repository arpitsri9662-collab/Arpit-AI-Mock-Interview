import { Request, Response } from 'express';
import Interview from '../models/Interview';
import Resume from '../models/Resume';
import {
  generateInterviewQuestion,
  evaluateAnswer,
  generateFinalReport,
  getGreeting,
  getClosingMessage,
  generateFollowUpQuestion,
} from '../services/aiService';
import { getResumeContext } from '../services/ragService';
import { AuthRequest } from '../middleware/auth';

const QUESTION_CATEGORIES = [
  'DSA',
  'SystemDesign',
  'DB',
  'HR',
  'Project',
];

const DIFFICULTY_SEQUENCE = [
  'easy',
  'medium',
  'medium',
  'hard',
  'medium',
  'hard',
  'medium',
  'hard',
  'medium',
  'hard',
];

const MAX_QUESTIONS = 10;

export const startInterview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      resumeId,
      duration,
      jobRole,
      interviewType,
      difficulty,
    } = req.body;

    let resumeData = null;
    let ragContext = '';

    if (resumeId) {
      const resume = await Resume.findById(resumeId);

      if (resume) {
        if (resume.userId.toString() !== req.user?.id) {
          res.status(403).json({
            message: 'Unauthorized resume',
          });
          return;
        }

        resumeData = resume.parsedData;

        /*
         * RAG:
         * Retrieve the most relevant parts of the candidate's
         * resume before generating the first question.
         */
        try {
          const ragQuery = `
            Generate an interview question for a ${jobRole || 'software developer'}
            candidate.

            Interview type: ${interviewType || 'mixed'}
            Category: ${QUESTION_CATEGORIES[0]}
            Difficulty: ${difficulty || 'easy'}

            Focus on the candidate's relevant skills, projects,
            experience, technologies, and accomplishments.
          `;

          ragContext = await getResumeContext(
            resume._id,
            ragQuery,
            5
          );

          console.log(
            `[RAG] Retrieved context for first interview question`
          );
        } catch (ragError) {
          /*
           * RAG should enhance the interview, not break the
           * existing interview system if embeddings are unavailable.
           */
          console.error(
            '[RAG] Failed to retrieve resume context:',
            ragError
          );

          ragContext = '';
        }
      }
    }

    // Determine categories based on interview type
    let categories = QUESTION_CATEGORIES;

    if (interviewType === 'technical') {
      categories = [
        'DSA',
        'SystemDesign',
        'DB',
        'Project',
        'DSA',
      ];
    } else if (interviewType === 'hr') {
      categories = [
        'HR',
        'Project',
        'HR',
        'Project',
        'HR',
      ];
    }

    const firstCategory = categories[0];
    const firstDifficulty = difficulty || 'easy';

    const firstQuestion = await generateInterviewQuestion(
      firstCategory,
      firstDifficulty,
      [],
      resumeData?.skills,
      resumeData?.projects?.map((p) => p.name),
      jobRole,
      interviewType,
      resumeData?.experience,
      resumeData?.projects,
      ragContext
    );

    const interview = new Interview({
      userId: req.user?.id,
      resumeId: resumeId || undefined,

      status: 'in_progress',

      questions: [
        {
          question: firstQuestion.question,
          category: firstQuestion.category as any,
          difficulty: firstQuestion.difficulty as any,
          idealAnswer: firstQuestion.idealAnswer,
        },
      ],

      currentQuestionIndex: 0,

      transcript: [
        {
          question: firstQuestion.question,
          answer: '',
          timestamp: new Date(),
        },
      ],

      duration: duration || 45,
      startedAt: new Date(),
    });

    await interview.save();

    const greeting = await getGreeting(req.user?.name);

    res.status(201).json({
      message: 'Interview started',
      greeting,

      interview: {
        id: interview._id,
        status: interview.status,
        currentQuestion: interview.questions[0],
        currentQuestionIndex:
          interview.currentQuestionIndex,
        totalQuestions: MAX_QUESTIONS,
        duration: interview.duration,
      },
    });
  } catch (error) {
    console.error('Error starting interview:', error);

    res.status(500).json({
      message: 'Error starting interview',
      error: String(error),
    });
  }
};

export const getNextQuestion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      res.status(404).json({
        message: 'Interview not found',
      });
      return;
    }

    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({
        message: 'Unauthorized',
      });
      return;
    }

    if (interview.status === 'completed') {
      res.status(400).json({
        message: 'Interview already completed',
      });
      return;
    }

    if (
      interview.currentQuestionIndex >=
      MAX_QUESTIONS - 1
    ) {
      res.status(400).json({
        message: 'Maximum questions reached',
      });
      return;
    }

    let resumeData = null;
    let ragContext = '';

    if (interview.resumeId) {
      const resume = await Resume.findById(
        interview.resumeId
      );

      if (resume) {
        if (resume.userId.toString() !== req.user?.id) {
          res.status(403).json({
            message: 'Unauthorized resume',
          });
          return;
        }

        resumeData = resume.parsedData;

        /*
         * Build conversation history first.
         * This gives RAG information about what has already
         * been discussed in the interview.
         */
      }
    }

    const conversationHistory =
      interview.transcript.map((t) => ({
        role: t.answer ? 'user' : 'assistant',
        content: t.answer || t.question,
        question: t.question,
        timestamp: new Date(t.timestamp),
      }));

    const category =
      QUESTION_CATEGORIES[
        (interview.currentQuestionIndex + 1) %
          QUESTION_CATEGORIES.length
      ];

    const difficulty =
      DIFFICULTY_SEQUENCE[
        interview.currentQuestionIndex + 1
      ] || 'medium';

    /*
     * RAG query is based on the next interview category and
     * previous conversation.
     *
     * This makes retrieval dynamic instead of always retrieving
     * the same resume chunks.
     */
    if (interview.resumeId) {
      try {
        const recentConversation =
          conversationHistory
            .slice(-3)
            .map((item) => item.content)
            .join('\n');

        const ragQuery = `
          Find the most relevant information from this candidate's
          resume for generating the next ${category} interview question.

          Difficulty: ${difficulty}

          Recent interview conversation:
          ${recentConversation || 'No previous conversation'}

          Focus on relevant technologies, skills, projects,
          work experience, responsibilities, achievements,
          and technical details.
        `;

        ragContext = await getResumeContext(
          interview.resumeId,
          ragQuery,
          5
        );

        console.log(
          `[RAG] Retrieved context for next ${category} question`
        );
      } catch (ragError) {
        console.error(
          '[RAG] Failed to retrieve context for next question:',
          ragError
        );

        ragContext = '';
      }
    }

    const newQuestion =
      await generateInterviewQuestion(
        category,
        difficulty,
        conversationHistory,
        resumeData?.skills,
        resumeData?.projects?.map((p) => p.name),
        undefined,
        undefined,
        resumeData?.experience,
        resumeData?.projects,
        ragContext
      );

    interview.questions.push({
      question: newQuestion.question,
      category: newQuestion.category as any,
      difficulty: newQuestion.difficulty as any,
      idealAnswer: newQuestion.idealAnswer,
    } as any);

    interview.transcript.push({
      question: newQuestion.question,
      answer: '',
      timestamp: new Date(),
    });

    interview.currentQuestionIndex += 1;

    await interview.save();

    res.json({
      question:
        interview.questions[
          interview.currentQuestionIndex
        ],

      currentIndex:
        interview.currentQuestionIndex,

      totalQuestions: MAX_QUESTIONS,
    });
  } catch (error) {
    console.error(
      'Error getting next question:',
      error
    );

    res.status(500).json({
      message: 'Error getting next question',
      error: String(error),
    });
  }
};

export const submitAnswer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { interviewId } = req.params;
    const { answer } = req.body;

    if (
      typeof answer !== 'string' ||
      !answer.trim()
    ) {
      res.status(400).json({
        message: 'Answer is required',
      });
      return;
    }

    const sanitizedAnswer = answer.trim();

    const interview = await Interview.findById(
      interviewId
    );

    if (!interview) {
      res.status(404).json({
        message: 'Interview not found',
      });
      return;
    }

    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({
        message: 'Unauthorized',
      });
      return;
    }

    if (interview.status === 'completed') {
      res.status(400).json({
        message: 'Interview already completed',
      });
      return;
    }

    const currentQuestion =
      interview.questions[
        interview.currentQuestionIndex
      ];

    if (!currentQuestion) {
      res.status(400).json({
        message: 'Current question not found',
      });
      return;
    }

    const conversationHistory =
      interview.transcript.map((t) => ({
        role: t.answer ? 'user' : 'assistant',
        content: t.answer || t.question,
        timestamp: new Date(t.timestamp),
      }));

    const evaluation = await evaluateAnswer(
      currentQuestion.question,
      sanitizedAnswer,
      currentQuestion.category,
      currentQuestion.difficulty,
      conversationHistory,
      currentQuestion.idealAnswer
    );

    interview.questions[
      interview.currentQuestionIndex
    ].answer = sanitizedAnswer;

    interview.questions[
      interview.currentQuestionIndex
    ].score = evaluation.score;

    interview.questions[
      interview.currentQuestionIndex
    ].feedback = evaluation.feedback;

    const transcriptIdx =
      interview.transcript.findIndex(
        (_, i) =>
          interview.questions[
            interview.currentQuestionIndex
          ].question ===
          interview.transcript[i].question
      );

    if (transcriptIdx >= 0) {
      interview.transcript[transcriptIdx].answer =
        sanitizedAnswer;
    }

    await interview.save();

    res.json({
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        idealAnswer: evaluation.idealAnswer,
        followUpQuestion:
          evaluation.followUpQuestion,
      },

      currentIndex:
        interview.currentQuestionIndex,

      totalQuestions: MAX_QUESTIONS,

      isLastQuestion:
        interview.currentQuestionIndex >=
        MAX_QUESTIONS - 1,
    });
  } catch (error) {
    console.error(
      'Error submitting answer:',
      error
    );

    res.status(500).json({
      message: 'Error submitting answer',
      error: String(error),
    });
  }
};

export const askFollowUp = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { interviewId } = req.params;
    const { answer } = req.body;

    const interview = await Interview.findById(
      interviewId
    );

    if (!interview) {
      res.status(404).json({
        message: 'Interview not found',
      });
      return;
    }

    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({
        message: 'Unauthorized',
      });
      return;
    }

    const currentQuestion =
      interview.questions[
        interview.currentQuestionIndex
      ];

    if (!currentQuestion) {
      res.status(400).json({
        message: 'Current question not found',
      });
      return;
    }

    const conversationHistory =
      interview.transcript.map((t) => ({
        role: t.answer ? 'user' : 'assistant',
        content: t.answer || t.question,
        timestamp: new Date(t.timestamp),
      }));

    const followUp =
      await generateFollowUpQuestion(
        currentQuestion.question,
        answer ||
          currentQuestion.answer ||
          '',
        currentQuestion.category,
        conversationHistory
      );

    res.json({
      followUpQuestion: followUp,
    });
  } catch (error) {
    console.error(
      'Error generating follow-up:',
      error
    );

    res.status(500).json({
      message: 'Error generating follow-up',
      error: String(error),
    });
  }
};

export const endInterview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { interviewId } = req.params;
    const { videoPath, bodyLanguageData } = req.body;

    const interview = await Interview.findById(
      interviewId
    );

    if (!interview) {
      res.status(404).json({
        message: 'Interview not found',
      });
      return;
    }

    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({
        message: 'Unauthorized',
      });
      return;
    }

    interview.status = 'completed';
    interview.completedAt = new Date();

    if (videoPath) {
      interview.videoPath = videoPath;
    }

    if (bodyLanguageData) {
      interview.bodyLanguageData =
        bodyLanguageData;
    }

    const scoredQuestions =
      interview.questions.filter(
        (q) => q.score !== undefined
      );

    const totalScore =
      scoredQuestions.reduce(
        (sum, q) => sum + (q.score || 0),
        0
      );

    interview.finalScore =
      scoredQuestions.length > 0
        ? totalScore / scoredQuestions.length
        : 0;

    const strongAreas =
      interview.questions
        .filter((q) => (q.score || 0) >= 4)
        .map((q) => q.category);

    const improvements =
      interview.questions
        .filter((q) => (q.score || 0) < 3)
        .map((q) => q.category);

    const closingMessage =
      await getClosingMessage(
        interview.finalScore,
        [...new Set(strongAreas)],
        [...new Set(improvements)]
      );

    await interview.save();

    res.json({
      message: 'Interview completed',
      closingMessage,

      interview: {
        id: interview._id,
        status: interview.status,
        finalScore: interview.finalScore,
        questionsCount:
          interview.questions.length,
        completedAt: interview.completedAt,
      },
    });
  } catch (error) {
    console.error(
      'Error ending interview:',
      error
    );

    res.status(500).json({
      message: 'Error ending interview',
      error: String(error),
    });
  }
};

export const getInterview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const interview =
      await Interview.findById(
        req.params.id
      ).populate('resumeId');

    if (!interview) {
      res.status(404).json({
        message: 'Interview not found',
      });
      return;
    }

    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({
        message: 'Unauthorized',
      });
      return;
    }

    res.json(interview);
  } catch (error) {
    console.error(
      'Error fetching interview:',
      error
    );

    res.status(500).json({
      message: 'Error fetching interview',
      error: String(error),
    });
  }
};

export const getUserInterviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.params.userId !== req.user?.id) {
      res.status(403).json({
        message: 'Unauthorized',
      });
      return;
    }

    const interviews =
      await Interview.find({
        userId: req.user?.id,
      })
        .populate('resumeId')
        .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    console.error(
      'Error fetching interviews:',
      error
    );

    res.status(500).json({
      message: 'Error fetching interviews',
      error: String(error),
    });
  }
};

export const getTranscript = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const interview =
      await Interview.findById(
        req.params.id
      );

    if (!interview) {
      res.status(404).json({
        message: 'Interview not found',
      });
      return;
    }

    if (interview.userId.toString() !== req.user?.id) {
      res.status(403).json({
        message: 'Unauthorized',
      });
      return;
    }

    res.json({
      transcript: interview.transcript,
      questions: interview.questions,
    });
  } catch (error) {
    console.error(
      'Error fetching transcript:',
      error
    );

    res.status(500).json({
      message: 'Error fetching transcript',
      error: String(error),
    });
  }
};