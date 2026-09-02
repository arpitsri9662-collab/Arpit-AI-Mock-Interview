import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { generateToken, AuthRequest } from '../middleware/auth';

const serializeUser = (user: { _id: any; email: string; name: string; role: string }) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    const sanitizedRole = role ? role.trim() : 'candidate';

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = new User({ email: sanitizedEmail, password, name: sanitizedName, role: sanitizedRole });
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Registration Error:', error);
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const sanitizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Login Error:', error);
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    res.json(req.user);
  } catch (error) {
    console.error('GetMe Error:', error);
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const updates: { name?: string; role?: string } = {};
    if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
    if (typeof req.body.role === 'string') updates.role = req.body.role.trim();

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('UpdateProfile Error:', error);
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const role = typeof req.body.role === 'string' ? req.body.role.trim() : undefined;
    if (!role) {
      res.status(400).json({ message: 'Role is required' });
      return;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { role }, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('UpdateSettings Error:', error);
    next(error);
  }
};
