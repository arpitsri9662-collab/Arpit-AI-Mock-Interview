# AI Mock Interview Platform - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [API Endpoints](#api-endpoints)
7. [How It Works](#how-it-works)
8. [Question Categories](#question-categories)
9. [Deployment](#deployment)
10. [FAQ](#faq)

---

## Project Overview

**AI Mock Interview Platform** is a full-stack AI-powered interview preparation platform that simulates real interview scenarios. It features:

- Conversational AI interviewer ("Alex")
- Voice input and text-to-speech
- Video recording of your interview
- Real-time feedback and scoring
- Detailed performance analytics
- Resume parsing for personalized questions

---

## Features

### 1. AI Interviewer (Alex)
- Natural conversational interface
- Asks questions like a real human interviewer
- Provides follow-up questions based on your answers
- Gives encouraging feedback

### 2. Voice Features
- **Text-to-Speech**: AI reads questions aloud
- **Voice Input**: Speak your answer instead of typing
- **Speech Recognition**: Uses browser's built-in speech API

### 3. Video Recording
- WebRTC-based webcam recording
- Records your entire interview session
- Download video for review

### 4. Question Bank (30+ Questions)
- **DSA** (Data Structures & Algorithms): 8 questions
- **System Design**: 6 questions
- **Database**: 6 questions
- **HR**: 6 questions
- **Project**: 5 questions
- Total: 31 unique questions with variations

### 5. Real-time Evaluation
- Score out of 5 for each question
- Detailed feedback
- Strengths and areas for improvement
- Follow-up questions

### 6. Analytics Dashboard
- Average score tracking
- Weak areas identification
- Strong areas highlight
- Interview history

### 7. Resume Upload
- PDF/DOCX parsing
- Skills extraction
- Project detection
- Personalized questions based on resume

---

## Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Monaco Editor** - Code editor (optional)
- **WebRTC** - Video/audio recording
- **Web Speech API** - Voice input/output

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **OpenAI** - AI (optional, works without it)

---

## Project Structure

```
AI-Mock-Interview-Platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts           # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── interviewController.ts
│   │   │   ├── resumeController.ts
│   │   │   └── videoController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authentication
│   │   │   └── upload.ts      # File upload handling
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Resume.ts
│   │   │   └── Interview.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── interview.ts
│   │   │   ├── resume.ts
│   │   │   ├── video.ts
│   │   │   └── analytics.ts
│   │   ├── services/
│   │   │   ├── aiService.ts    # AI logic + question bank
│   │   │   ├── resumeParser.ts # PDF/DOCX parsing
│   │   │   └── videoService.ts
│   │   └── index.ts            # Main server file
│   ├── uploads/               # File uploads
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Interview.tsx  # Main interview page
│   │   │   ├── ResumeUpload.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── InterviewResult.tsx
│   │   ├── store/
│   │   │   └── authStore.ts   # Zustand store
│   │   ├── services/
│   │   │   └── api.ts         # API calls
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── SPEC.md                    # Technical specification
└── README.md                  # This file
```

---

## Setup Instructions

### Prerequisites
1. **Node.js** (v18 or higher)
2. **MongoDB** (local or Atlas)
3. **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/anuragverma4895/AI-Mock-Interview-Platform.git
cd AI-Mock-Interview-Platform
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-mock-interview
JWT_SECRET=your-secret-key-change-this
NODE_ENV=development
# Optional: Add OpenAI key for smarter AI
# OPENAI_API_KEY=sk-your-key-here
```

Start backend:
```bash
npm run dev
```
Server runs on `http://localhost:5000`

### Step 3: Frontend Setup

Open new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`

### Step 4: Use the App

1. Open `http://localhost:3000`
2. Register a new account
3. Login with credentials
4. Click "Start Interview"
5. Answer questions (type or speak)
6. View results and analytics

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume (PDF/DOCX) |
| GET | `/api/resume/:id` | Get resume by ID |
| GET | `/api/resume/user/:userId` | Get user's resumes |
| DELETE | `/api/resume/:id` | Delete resume |

### Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/start` | Start new interview |
| GET | `/api/interview/next-question/:id` | Get next question |
| POST | `/api/interview/submit-answer/:id` | Submit answer |
| POST | `/api/interview/follow-up/:id` | Get follow-up question |
| POST | `/api/interview/end/:id` | End interview |
| GET | `/api/interview/:id` | Get interview details |
| GET | `/api/interview/user/:userId` | Get user's interviews |
| GET | `/api/interview/transcript/:id` | Get transcript |

### Video
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/video/upload-chunk` | Upload video chunk |
| POST | `/api/video/finalize` | Finalize video |
| GET | `/api/video/:id` | Get video info |
| GET | `/api/video/:id/download` | Download video |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/:userId` | Get user analytics |
| GET | `/api/analytics/interview/:id` | Get interview analytics |

---

## How It Works

### 1. Starting an Interview
```
User clicks "Start Interview"
    → Backend creates interview session
    → AI selects first question from question bank
    → Returns question + greeting
    → Frontend displays with avatar
```

### 2. Answering Questions
```
User submits answer (typing or voice)
    → Backend evaluates answer
    → Generates score (1-5)
    → Provides feedback
    → Suggests follow-up question
    → User proceeds to next question
```

### 3. Interview Completion
```
After 10 questions or user ends
    → Backend calculates final score
    → Generates closing message
    → Saves video (if recorded)
    → Stores all data in MongoDB
```

### 4. Viewing Results
```
User clicks on completed interview
    → Shows final score
    → Question-by-question breakdown
    → Strengths and improvements
    → Body language analysis (if available)
    → Option to download video
```

---

## Question Categories

### DSA (Data Structures & Algorithms) - 8 Questions
1. Array vs Linked List difference
2. Array access time complexity
3. Hash table and hashing explained
4. BFS vs DFS comparison
5. Recursion concept and usage
6. Binary Search Tree insertion
7. Stack vs Queue difference
8. Dynamic programming concept

### System Design - 6 Questions
1. URL shortener design
2. E-commerce platform architecture
3. Load balancing importance
4. Chat application design
5. Microservices vs Monolithic
6. Caching implementation

### Database - 6 Questions
1. SQL vs NoSQL difference
2. Database normalization types
3. Database indexes and performance
4. ACID properties
5. INNER JOIN vs OUTER JOIN
6. SQL query optimization

### HR - 6 Questions
1. Tell me about yourself
2. Strengths and weaknesses
3. Future goals (5 years)
4. Why do you want to join?
5. Challenging project experience
6. Conflict handling in team

### Project - 5 Questions
1. Proud project walkthrough
2. Difficult technical problem solved
3. Recent project architecture
4. Technologies used and reasons
5. Debugging approach

---

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import repository
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect to [Render](https://render.com) or [Railway](https://railway.app)
3. Set environment variables
4. Build command: `npm run build`
5. Start command: `npm start`

### Database (MongoDB Atlas)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to backend environment variables

---

## FAQ

### Q1: Do I need an OpenAI API key?
**No!** The platform works without OpenAI. It uses a built-in question bank with 31+ questions. Add your key later for smarter AI.

### Q2: Why is the AI not responding like ChatGPT?
The app is in "local mode" using the question bank. Add `OPENAI_API_KEY` in .env to enable AI mode.

### Q3: How many questions are there?
10 questions per interview from 5 categories (DSA, SystemDesign, DB, HR, Project).

### Q4: Can I use my resume?
Yes! Upload your PDF/DOCX resume. The AI will personalize questions based on your skills and projects.

### Q5: Is video recording required?
No, it's optional. You can enable/disable recording during the interview.

### Q6: How is scoring done?
Score is 1-5 based on:
- Understanding of topic
- Technical depth
- Communication clarity
- Practical examples

### Q7: Can I practice again?
Yes! Start as many interviews as you want from your dashboard.

---

## Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-mock-interview

# Security
JWT_SECRET=your-secret-key

# AI (Optional - works without it)
# OPENAI_API_KEY=sk-your-openai-key

# Configuration
INTERVIEW_DURATION=45
MAX_QUESTIONS=10
ROLE=Full Stack Developer
DIFFICULTY=Mixed
```

---

## Security Features

- JWT authentication for protected routes
- Password hashing with bcrypt
- CORS configuration
- Helmet for HTTP security
- File type validation for uploads
- Input validation

---

## License

MIT License - Feel free to use and modify!

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/anuragverma4895/AI-Mock-Interview-Platform/issues

---

**Happy Interviewing! Good luck with your preparation!**