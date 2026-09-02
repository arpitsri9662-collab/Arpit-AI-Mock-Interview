import { Request, Response } from 'express';
import Resume from '../models/Resume';
import { parseResume, analyzeResumeSuitability } from '../services/resumeParser';
import path from 'path';
import { auth, AuthRequest } from '../middleware/auth';

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const parsedData = await parseResume(req.file.path);

    const resume = new Resume({
      userId: req.user?.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      parsedData,
    });

    await resume.save();

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        parsedData: resume.parsedData,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ message: 'Error uploading resume', error: String(error) });
  }
};

export const getResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resume', error: String(error) });
  }
};

export const getUserResumes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resumes = await Resume.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resumes', error: String(error) });
  }
};

export const analyzeResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    const { role } = req.body;
    if (!role) {
      res.status(400).json({ message: 'Role is required' });
      return;
    }

    const analysis = await analyzeResumeSuitability(resume.parsedData, role);

    res.json({
      resumeId: resume._id,
      role,
      analysis,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing resume', error: String(error) });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!resume) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resume', error: String(error) });
  }
};