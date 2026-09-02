import OpenAI from 'openai';
import retry from 'async-retry';

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
}) : null;

const USE_AI = !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

// ═══════════════════════════════════════════════════════════════════
// FALLBACK QUESTION BANK (used only when AI is unavailable)
// ═══════════════════════════════════════════════════════════════════
const QUESTION_BANK = {
  DSA: [
    { question: "Can you explain the difference between an array and a linked list?", difficulty: "easy" },
    { question: "What is the time complexity of accessing an element in an array?", difficulty: "easy" },
    { question: "Explain how a hash table works and what is hashing?", difficulty: "medium" },
    { question: "What is the difference between BFS and DFS?", difficulty: "medium" },
    { question: "Explain the concept of recursion and when would you use it?", difficulty: "easy" },
    { question: "What is a binary search tree and how does insertion work?", difficulty: "medium" },
    { question: "Can you explain the difference between stack and queue?", difficulty: "easy" },
    { question: "What is dynamic programming and when is it used?", difficulty: "hard" },
  ],
  SystemDesign: [
    { question: "How would you design a URL shortener like bit.ly?", difficulty: "medium" },
    { question: "Explain the architecture of a typical e-commerce platform?", difficulty: "hard" },
    { question: "What is load balancing and why is it important?", difficulty: "medium" },
    { question: "How would you design a chat application?", difficulty: "hard" },
    { question: "Explain the concept of microservices vs monolithic architecture?", difficulty: "medium" },
    { question: "What is caching and how would you implement it?", difficulty: "medium" },
  ],
  DB: [
    { question: "What is the difference between SQL and NoSQL databases?", difficulty: "easy" },
    { question: "Explain normalization and its types?", difficulty: "medium" },
    { question: "What are database indexes and how do they improve performance?", difficulty: "medium" },
    { question: "Explain ACID properties in databases?", difficulty: "medium" },
    { question: "What is the difference between INNER JOIN and OUTER JOIN?", difficulty: "easy" },
    { question: "How would you optimize a slow SQL query?", difficulty: "hard" },
  ],
  HR: [
    { question: "Tell me about yourself and your journey in tech?", difficulty: "easy" },
    { question: "What are your strengths and weaknesses?", difficulty: "easy" },
    { question: "Where do you see yourself in 5 years?", difficulty: "easy" },
    { question: "Why do you want to join our company?", difficulty: "easy" },
    { question: "Describe a challenging project you worked on?", difficulty: "medium" },
    { question: "How do you handle conflict in a team?", difficulty: "medium" },
  ],
  Project: [
    { question: "Walk me through a project you're most proud of?", difficulty: "medium" },
    { question: "What was the most difficult technical problem you solved?", difficulty: "medium" },
    { question: "Explain the architecture of your recent project?", difficulty: "hard" },
    { question: "What technologies did you use in your last project and why?", difficulty: "medium" },
    { question: "How do you handle debugging in your projects?", difficulty: "easy" },
  ]
};

const selectQuestion = (category: string, difficulty: string, conversationHistory: any[] = []) => {
  const questions = QUESTION_BANK[category as keyof typeof QUESTION_BANK] || QUESTION_BANK.DSA;
  const usedQuestions = new Set(
    conversationHistory
      .map(item => String(item.content || item.question || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const matchingDifficulty = questions.filter(q => q.difficulty === difficulty);
  const candidates = matchingDifficulty.length > 0 ? matchingDifficulty : questions;
  return candidates.find(q => !usedQuestions.has(q.question.toLowerCase())) || candidates[0];
};

const clampScore = (score: unknown): number => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return 0;
  return Math.max(0, Math.min(5, Math.round(numericScore * 10) / 10));
};

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  DSA: ['complexity', 'time', 'space', 'array', 'linked', 'hash', 'tree', 'stack', 'queue', 'recursion', 'algorithm'],
  SystemDesign: ['scale', 'cache', 'database', 'load', 'latency', 'queue', 'service', 'api', 'storage', 'partition'],
  DB: ['index', 'query', 'table', 'schema', 'transaction', 'acid', 'join', 'normalization', 'sql', 'nosql'],
  HR: ['experience', 'team', 'communication', 'challenge', 'learning', 'strength', 'weakness', 'goal', 'conflict'],
  Project: ['architecture', 'technology', 'debug', 'problem', 'solution', 'feature', 'testing', 'deployment', 'impact'],
};

const evaluateAnswerLocally = (
  question: string,
  answer: string,
  category: string,
  idealAnswer?: string
): AnswerEvaluation => {
  const trimmedAnswer = answer.trim();
  const words = tokenize(trimmedAnswer);
  const uniqueWords = new Set(words);

  // Build expected tokens from the ideal answer (most important), the question, and category keywords
  const idealTokens = tokenize(idealAnswer || '');
  const questionTokens = tokenize(question);
  const categoryTokens = CATEGORY_KEYWORDS[category] || [];
  const allExpectedTokens = new Set([...idealTokens, ...questionTokens, ...categoryTokens]);

  // Count how many expected keywords the answer hits
  const matchedAll = [...uniqueWords].filter(word => allExpectedTokens.has(word)).length;
  // Specifically measure overlap with the ideal answer (most accurate signal)
  const idealTokenSet = new Set(idealTokens);
  const matchedIdeal = idealTokens.length > 0
    ? [...uniqueWords].filter(word => idealTokenSet.has(word)).length
    : 0;
  const idealCoverage = idealTokenSet.size > 0 ? matchedIdeal / idealTokenSet.size : 0;

  // ----- Scoring (out of 5) -----
  // Relevance to ideal answer: up to 2.0 points
  const relevanceScore = Math.min(2, idealCoverage * 3);
  // Keyword breadth (question + category terms): up to 1.0 point
  const keywordScore = Math.min(1, matchedAll * 0.15);
  // Use of examples / reasoning: 0.5 point
  const exampleScore = /\b(example|for instance|because|trade-?off|complexity|use case|in my project|we used|such as|like when)\b/i.test(trimmedAnswer) ? 0.5 : 0;
  // Structure / multi-sentence answer: 0.5 point
  const structureScore = /[.!?]\s+\w/.test(trimmedAnswer) || /first|second|then|finally|step/i.test(trimmedAnswer) ? 0.5 : 0;
  // Minimum length gate (just to penalise blank/1-word answers): up to 0.5
  const lengthGate = words.length >= 15 ? 0.5 : words.length >= 5 ? 0.25 : 0;

  // Base of 0.5 so even an attempt gets something
  const score = clampScore(0.5 + relevanceScore + keywordScore + exampleScore + structureScore + lengthGate);

  const strengths: string[] = [];
  if (idealCoverage >= 0.3) strengths.push('Your answer covers key concepts from the expected answer.');
  if (matchedAll >= 3) strengths.push(`Good use of relevant ${category} terminology.`);
  if (exampleScore > 0) strengths.push('Included practical examples or reasoning.');
  if (structureScore > 0) strengths.push('Well-structured, multi-sentence answer.');
  if (strengths.length === 0) strengths.push('Answer was submitted clearly.');

  const improvements: string[] = [];
  if (idealCoverage < 0.3) improvements.push('Cover more key concepts that the question is asking about.');
  if (matchedAll < 3) improvements.push(`Use more precise ${category} terminology in your answer.`);
  if (exampleScore === 0) improvements.push('Add practical examples or reasoning to support your answer.');
  if (words.length < 15) improvements.push('Provide a more detailed and thorough answer.');
  if (improvements.length === 0) improvements.push('Consider mentioning edge cases, limitations, or alternatives.');

  return {
    score,
    feedback: `Score is based on how well your answer matches the expected concepts, use of relevant terminology, examples, and structure.`,
    strengths,
    improvements,
    idealAnswer: idealAnswer || 'A strong answer should explain the core concept, discuss trade-offs, and include a practical example.',
    followUpQuestion: `Can you elaborate further on the key concepts in your ${category} answer?`,
  };
};

export interface GeneratedQuestion {
  question: string;
  category: string;
  difficulty: string;
  idealAnswer: string;
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
  followUpQuestion?: string;
}

// ═══════════════════════════════════════════════════════════════════
// GEMINI API INTEGRATION (real-time, no SDK, native fetch)
// ═══════════════════════════════════════════════════════════════════

// Use the latest Gemini model
const GEMINI_MODEL = 'gemini-flash-latest';

async function getAICompletion(prompt: string, systemPrompt: string = "You are Alex, a professional and friendly technical interviewer at a top tech company."): Promise<string> {
  const callAI = async (bail: (error: Error) => void, attempt: number) => {
    console.log(`AI attempt ${attempt}`);

    // Try Gemini first
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
              generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Gemini API HTTP ${response.status}:`, errorBody);
          const error = new Error(`Gemini API error: ${response.status}`);
          if (response.status >= 500) throw error; // Retry on server errors
          bail(error); // Don't retry 4xx
          return ''; // Unreachable but satisfies TS
        }

        const data: any = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!result) {
          console.error('Empty Gemini response:', JSON.stringify(data));
          throw new Error('Empty response from Gemini');
        }
        return result;
      } catch (error: any) {
        console.error('Gemini API Error:', error.message);
        if (error.message.includes('API error')) {
          if (error.message.includes('403') || error.message.includes('401')) {
            bail(error); // Key issue — don't retry
            return '';
          }
          throw error; // Retry 5xx
        }
        // Network errors — fall through to OpenAI
      }
    }

    // Try OpenAI as fallback
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        });
        const result = completion.choices[0]?.message?.content;
        if (!result) throw new Error('Empty response from OpenAI');
        return result;
      } catch (error: any) {
        console.error('OpenAI API Error:', error);
        if (error.message.includes('rate limit') || error.message.includes('timeout')) {
          throw error; // Retry
        }
        bail(error); // Don't retry other errors
        return '';
      }
    }

    throw new Error('No AI service available');
  };

  try {
    return await retry(callAI, {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error: any, attempt: number) => {
        console.log(`Retrying AI call, attempt ${attempt}:`, error.message);
      }
    });
  } catch (error) {
    console.error('All AI attempts failed:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUESTION GENERATION — Real-time, resume-aware, context-aware
// ═══════════════════════════════════════════════════════════════════

export const generateInterviewQuestion = async (
  category: string,
  difficulty: string,
  conversationHistory: any[] = [],
  resumeSkills?: string[],
  projectNames?: string[],
  jobRole?: string,
  interviewType?: string,
  experience?: Array<{ company: string; role: string; duration: string }>,
  projectDescriptions?: Array<{ name: string; description: string }>
): Promise<GeneratedQuestion> => {
  if (!USE_AI) {
    const q = selectQuestion(category, difficulty, conversationHistory);
    return {
      question: q.question,
      category,
      difficulty: q.difficulty,
      idealAnswer: "A comprehensive answer covering key concepts and practical examples."
    };
  }

  try {
    // Build the previously-asked questions list to avoid repetition
    const previousQuestions = conversationHistory
      .filter(h => h.role === 'assistant' || h.question)
      .map(h => h.content || h.question)
      .filter(Boolean);

    const prompt = `You are conducting a real mock interview for a ${jobRole || 'software developer'} position.

CATEGORY: ${category}
DIFFICULTY: ${difficulty}
INTERVIEW TYPE: ${interviewType || 'technical'}

${resumeSkills?.length ? `CANDIDATE'S SKILLS (from resume): ${resumeSkills.join(', ')}` : ''}
${projectDescriptions?.length ? `CANDIDATE'S PROJECTS:\n${projectDescriptions.map(p => `- ${p.name}: ${p.description}`).join('\n')}` : projectNames?.length ? `CANDIDATE'S PROJECTS: ${projectNames.join(', ')}` : ''}
${experience?.length ? `CANDIDATE'S EXPERIENCE:\n${experience.map(e => `- ${e.role} at ${e.company} (${e.duration})`).join('\n')}` : ''}

${previousQuestions.length > 0 ? `ALREADY ASKED (DO NOT REPEAT):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

INSTRUCTIONS:
- Generate ONE ${difficulty}-level interview question for the ${category} category
- Keep the question SHORT, CLEAR, and DIRECT. Maximum 1-2 sentences.
- Use simple, easy-to-understand language. Do not ask overly complex, wordy, or multi-part questions.
- The question MUST be personalized to the candidate's resume, skills, and projects if available
- For ${category === 'Project' ? 'project questions: ask about specific projects from their resume' : category === 'HR' ? 'HR questions: ask behavioral/situational questions relevant to their experience level' : category === 'DSA' ? 'DSA questions: relate to technologies they use (e.g., if they know React, ask about virtual DOM diffing algorithms)' : category === 'SystemDesign' ? 'system design: ask them to design something related to projects they have built' : category === 'DB' ? 'database questions: relate to the databases/ORMs they have used' : 'technical questions relevant to their stack'}
- Make it sound natural — like a real interviewer asking, not a textbook question
- Do NOT repeat any previously asked question
- Question should test real understanding, not just definitions

Respond in this EXACT JSON format:
{
  "question": "Your interview question here",
  "idealAnswer": "A brief 2-3 sentence ideal answer outline"
}`;

    const response = await getAICompletion(prompt, 'You are Alex, a senior technical interviewer. Output ONLY valid JSON, no markdown, no explanation.');

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        question: data.question || 'Tell me about your technical experience.',
        category,
        difficulty,
        idealAnswer: data.idealAnswer || 'A comprehensive answer with practical examples.'
      };
    }

    // If not JSON, use the raw text as the question
    return {
      question: response.trim().replace(/^["']|["']$/g, ''),
      category,
      difficulty,
      idealAnswer: 'A comprehensive answer with practical examples.'
    };
  } catch (error) {
    console.error('Question generation failed, using fallback:', error);
    const q = selectQuestion(category, difficulty, conversationHistory);
    return {
      question: q.question,
      category,
      difficulty: q.difficulty,
      idealAnswer: "Expected answer with practical examples"
    };
  }
};

// ═══════════════════════════════════════════════════════════════════
// ANSWER EVALUATION — Real-time, detailed AI feedback
// ═══════════════════════════════════════════════════════════════════

export const evaluateAnswer = async (
  question: string,
  answer: string,
  category: string,
  difficulty: string,
  conversationHistory: any[] = [],
  idealAnswer?: string
): Promise<AnswerEvaluation> => {
  if (!USE_AI) {
    return evaluateAnswerLocally(question, answer, category, idealAnswer);
  }

  try {
    const prompt = `You are evaluating a candidate's answer in a real mock interview.

QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}
${idealAnswer ? `IDEAL ANSWER OUTLINE: ${idealAnswer}` : ''}

EVALUATION CRITERIA:
- Technical accuracy and depth of knowledge
- Use of practical examples and real-world scenarios
- Communication clarity and structure
- Relevance to the question asked
- For ${difficulty} difficulty, expect ${difficulty === 'easy' ? 'basic understanding' : difficulty === 'medium' ? 'solid understanding with examples' : 'deep expertise with edge cases and trade-offs'}

Score from 1 to 5:
1 = Very weak / irrelevant
2 = Below average / vague
3 = Average / acceptable
4 = Good / solid understanding
5 = Excellent / comprehensive

Provide your evaluation as ONLY this JSON (no markdown, no extra text):
{
  "score": <number 1-5>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "idealAnswer": "<3-4 sentence ideal answer>",
  "followUpQuestion": "<a deeper follow-up question based on their answer>"
}`;

    const responseText = await getAICompletion(prompt, "You are a professional technical interviewer AI. Output ONLY valid JSON.");

    // Parse JSON safely
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    return {
      score: clampScore(data.score),
      feedback: data.feedback || "Evaluation completed.",
      strengths: Array.isArray(data.strengths) ? data.strengths.slice(0, 3) : ['Answer was submitted.'],
      improvements: Array.isArray(data.improvements) ? data.improvements.slice(0, 3) : ['Add more detail.'],
      idealAnswer: data.idealAnswer || idealAnswer || "A comprehensive technical answer with examples.",
      followUpQuestion: data.followUpQuestion || "Can you elaborate on that?"
    };
  } catch (error) {
    console.error('AI Evaluation Error, using local fallback:', error);
    return evaluateAnswerLocally(question, answer, category, idealAnswer);
  }
};

// ═══════════════════════════════════════════════════════════════════
// FOLLOW-UP QUESTIONS — Context-aware deep-dive
// ═══════════════════════════════════════════════════════════════════

export const generateFollowUpQuestion = async (
  previousQuestion: string,
  previousAnswer: string,
  category: string,
  conversationHistory: any[] = []
): Promise<string> => {
  if (!USE_AI) return "Can you explain that in more detail?";

  try {
    const prompt = `In a mock interview, the candidate was asked: "${previousQuestion}"
They answered: "${previousAnswer}"

Generate ONE natural follow-up question that:
- Digs deeper into their answer
- Tests if they truly understand the concept
- Relates to the ${category} domain
- Sounds like a real interviewer probing further

Output ONLY the follow-up question text, nothing else.`;

    return await getAICompletion(prompt);
  } catch (error) {
    return "Can you explain your thought process behind that?";
  }
};

// ═══════════════════════════════════════════════════════════════════
// GREETING & CLOSING — Personalized
// ═══════════════════════════════════════════════════════════════════

export const getGreeting = async (candidateName?: string): Promise<string> => {
  const name = candidateName?.trim() || 'there';
  return `Hi ${name}! Welcome to your mock interview. I'm Alex, your AI interviewer. Let's get started — remember, this is a safe space to practice, so take your time with each answer.`;
};

export const getClosingMessage = async (
  finalScore: number,
  strongAreas: string[],
  improvements: string[]
): Promise<string> => {
  if (!USE_AI) {
    if (finalScore >= 4) {
      return `Great job! You showed excellent skills in ${strongAreas[0] || 'technical knowledge'}. Keep it up and you'll do amazing in real interviews!`;
    } else if (finalScore >= 3) {
      return `Good effort! You have a solid foundation. Focus on ${improvements[0] || 'practicing more'} and you'll improve quickly. Best of luck!`;
    } else {
      return `Thank you for completing the interview! Keep practicing and don't give up. Every interview is a learning opportunity. All the best!`;
    }
  }

  try {
    const prompt = `A candidate just finished a mock interview with a score of ${finalScore.toFixed(1)}/5.
Strong areas: ${strongAreas.join(', ') || 'none identified'}
Areas to improve: ${improvements.join(', ') || 'none identified'}

Write a brief, encouraging closing message (2-3 sentences) as the interviewer "Alex". Be specific about what they did well and what to work on. Be motivating but honest.
Output ONLY the message text.`;

    return await getAICompletion(prompt);
  } catch {
    if (finalScore >= 4) {
      return `Great job! You showed excellent skills in ${strongAreas[0] || 'technical knowledge'}. Keep it up!`;
    } else if (finalScore >= 3) {
      return `Good effort! Focus on ${improvements[0] || 'practicing more'} and you'll improve quickly.`;
    }
    return `Thank you for completing the interview! Keep practicing — every session makes you stronger.`;
  }
};

// ═══════════════════════════════════════════════════════════════════
// FINAL REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════

export const generateFinalReport = async (
  questions: any[],
  bodyLanguageData?: any
): Promise<string> => {
  const validScores = questions.filter(q => q.score !== undefined);
  const avgScore = validScores.length > 0 
    ? validScores.reduce((sum, q) => sum + q.score, 0) / validScores.length 
    : 0;
  
  let report = `# Interview Report\n\n`;
  report += `## Overall Performance\n`;
  report += `Average Score: ${avgScore.toFixed(1)}/5\n\n`;
  report += `## Question Summary\n`;
  
  questions.forEach((q, i) => {
    report += `Q${i+1}: ${q.category} (${q.difficulty}) - Score: ${q.score !== undefined ? q.score : 'N/A'}/5\n`;
  });
  
  report += `\n## Recommendations\n`;
  const weakCategories = Array.from(new Set(questions.filter(q => (q.score || 0) < 3).map(q => q.category)));
  report += `- Continue practicing ${weakCategories.join(', ') || 'technical skills'}\n`;
  report += `- Focus on communication skills\n`;
  report += `- Practice more real interview scenarios\n`;
  
  return report;
};
