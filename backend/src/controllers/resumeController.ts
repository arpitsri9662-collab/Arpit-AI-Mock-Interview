import { Request, Response } from 'express';
import Resume from '../models/Resume';
import {
  parseResume,
  analyzeResumeSuitability,
} from '../services/resumeParser';
import {
  createResumeChunks,
  deleteResumeChunks,
} from '../services/ragService';
import { AuthRequest } from '../middleware/auth';

export const uploadResume = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        message: 'No file uploaded',
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        message: 'Unauthorized',
      });
      return;
    }

    // Parse the uploaded PDF/DOCX.
    const parsedResume = await parseResume(req.file.path);

    const {
      text: resumeText,
      skills,
      projects,
      experience,
    } = parsedResume;

    if (!resumeText || resumeText.trim().length === 0) {
      res.status(400).json({
        message: 'Could not extract text from the uploaded resume',
      });
      return;
    }

    // Save the resume and its structured information.
    const resume = new Resume({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      resumeText,
      parsedData: {
        skills,
        projects,
        experience,
      },
    });

    await resume.save();

    // Create RAG chunks + embeddings and store them in MongoDB.
    try {
      const chunkCount = await createResumeChunks(
        resume._id,
        req.user.id,
        resumeText
      );

      console.log(
        `[RAG] Resume ${resume._id} processed successfully with ${chunkCount} chunks`
      );
    } catch (ragError) {
      console.error(
        '[RAG] Failed to create resume embeddings:',
        ragError
      );

      // Remove the resume because RAG processing failed.
      await Resume.findByIdAndDelete(resume._id);

      res.status(500).json({
        message:
          'Resume uploaded, but RAG processing failed. Please make sure OPENAI_API_KEY is configured correctly.',
        error: String(ragError),
      });

      return;
    }

    res.status(201).json({
      message: 'Resume uploaded and processed successfully',

      resume: {
        id: resume._id,
        fileName: resume.fileName,
        parsedData: resume.parsedData,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error('Error uploading resume:', error);

    res.status(500).json({
      message: 'Error uploading resume',
      error: String(error),
    });
  }
};

export const getResume = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      res.status(404).json({
        message: 'Resume not found',
      });
      return;
    }

    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);

    res.status(500).json({
      message: 'Error fetching resume',
      error: String(error),
    });
  }
};

export const getUserResumes = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: 'Unauthorized',
      });
      return;
    }

    const resumes = await Resume.find({
      userId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.json(resumes);
  } catch (error) {
    console.error('Error fetching user resumes:', error);

    res.status(500).json({
      message: 'Error fetching resumes',
      error: String(error),
    });
  }
};

export const analyzeResume = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: 'Unauthorized',
      });
      return;
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      res.status(404).json({
        message: 'Resume not found',
      });
      return;
    }

    const { role } = req.body;

    if (!role) {
      res.status(400).json({
        message: 'Role is required',
      });
      return;
    }

    // analyzeResumeSuitability expects the complete ParsedResume object.
    const parsedResume = {
      text: resume.resumeText,
      skills: resume.parsedData.skills,
      projects: resume.parsedData.projects,
      experience: resume.parsedData.experience,
    };

    const analysis = await analyzeResumeSuitability(
      parsedResume,
      role
    );

    res.json({
      resumeId: resume._id,
      role,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);

    res.status(500).json({
      message: 'Error analyzing resume',
      error: String(error),
    });
  }
};

export const deleteResume = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: 'Unauthorized',
      });
      return;
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      res.status(404).json({
        message: 'Resume not found',
      });
      return;
    }

    // Delete all RAG chunks/embeddings associated with this resume.
    try {
      await deleteResumeChunks(resume._id);
    } catch (ragError) {
      console.error(
        '[RAG] Failed to delete resume chunks:',
        ragError
      );
    }

    // Delete the actual resume document.
    await Resume.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting resume:', error);

    res.status(500).json({
      message: 'Error deleting resume',
      error: String(error),
    });
  }
};