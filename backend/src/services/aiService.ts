import retry from 'async-retry';

// ═══════════════════════════════════════════════════════════════════
// LOCAL OLLAMA CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const OLLAMA_CHAT_MODEL =
  process.env.OLLAMA_CHAT_MODEL || 'llama3.2:3b';

// Ollama is completely local.
// No OpenAI/Gemini API key or paid service is required.
const USE_AI = true;

// ═══════════════════════════════════════════════════════════════════
// FALLBACK QUESTION BANK
// ═══════════════════════════════════════════════════════════════════

const QUESTION_BANK = {
  DSA: [
    {
      question:
        'Can you explain the difference between an array and a linked list?',
      difficulty: 'easy',
    },
    {
      question:
        'What is the time complexity of accessing an element in an array?',
      difficulty: 'easy',
    },
    {
      question:
        'Explain how a hash table works and what is hashing?',
      difficulty: 'medium',
    },
    {
      question: 'What is the difference between BFS and DFS?',
      difficulty: 'medium',
    },
    {
      question:
        'Explain the concept of recursion and when would you use it?',
      difficulty: 'easy',
    },
    {
      question:
        'What is a binary search tree and how does insertion work?',
      difficulty: 'medium',
    },
    {
      question:
        'Can you explain the difference between stack and queue?',
      difficulty: 'easy',
    },
    {
      question:
        'What is dynamic programming and when is it used?',
      difficulty: 'hard',
    },
  ],

  SystemDesign: [
    {
      question:
        'How would you design a URL shortener like bit.ly?',
      difficulty: 'medium',
    },
    {
      question:
        'Explain the architecture of a typical e-commerce platform?',
      difficulty: 'hard',
    },
    {
      question:
        'What is load balancing and why is it important?',
      difficulty: 'medium',
    },
    {
      question:
        'How would you design a chat application?',
      difficulty: 'hard',
    },
    {
      question:
        'Explain the concept of microservices vs monolithic architecture?',
      difficulty: 'medium',
    },
    {
      question:
        'What is caching and how would you implement it?',
      difficulty: 'medium',
    },
  ],

  DB: [
    {
      question:
        'What is the difference between SQL and NoSQL databases?',
      difficulty: 'easy',
    },
    {
      question:
        'Explain normalization and its types?',
      difficulty: 'medium',
    },
    {
      question:
        'What are database indexes and how do they improve performance?',
      difficulty: 'medium',
    },
    {
      question:
        'Explain ACID properties in databases?',
      difficulty: 'medium',
    },
    {
      question:
        'What is the difference between INNER JOIN and OUTER JOIN?',
      difficulty: 'easy',
    },
    {
      question:
        'How would you optimize a slow SQL query?',
      difficulty: 'hard',
    },
  ],

  HR: [
    {
      question:
        'Tell me about yourself and your journey in tech?',
      difficulty: 'easy',
    },
    {
      question:
        'What are your strengths and weaknesses?',
      difficulty: 'easy',
    },
    {
      question:
        'Where do you see yourself in 5 years?',
      difficulty: 'easy',
    },
    {
      question:
        'Why do you want to join our company?',
      difficulty: 'easy',
    },
    {
      question:
        'Describe a challenging project you worked on?',
      difficulty: 'medium',
    },
    {
      question:
        'How do you handle conflict in a team?',
      difficulty: 'medium',
    },
  ],

  Project: [
    {
      question:
        "Walk me through a project you're most proud of?",
      difficulty: 'medium',
    },
    {
      question:
        'What was the most difficult technical problem you solved?',
      difficulty: 'medium',
    },
    {
      question:
        'Explain the architecture of your recent project?',
      difficulty: 'hard',
    },
    {
      question:
        'What technologies did you use in your last project and why?',
      difficulty: 'medium',
    },
    {
      question:
        'How do you handle debugging in your projects?',
      difficulty: 'easy',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// QUESTION SELECTION
// ═══════════════════════════════════════════════════════════════════

const selectQuestion = (
  category: string,
  difficulty: string,
  conversationHistory: any[] = []
) => {
  const questions =
    QUESTION_BANK[
      category as keyof typeof QUESTION_BANK
    ] || QUESTION_BANK.DSA;

  const usedQuestions = new Set(
    conversationHistory
      .map((item) =>
        String(
          item.content ||
            item.question ||
            ''
        )
          .trim()
          .toLowerCase()
      )
      .filter(Boolean)
  );

  const matchingDifficulty = questions.filter(
    (q) => q.difficulty === difficulty
  );

  const candidates =
    matchingDifficulty.length > 0
      ? matchingDifficulty
      : questions;

  return (
    candidates.find(
      (q) =>
        !usedQuestions.has(
          q.question.toLowerCase()
        )
    ) || candidates[0]
  );
};

// ═══════════════════════════════════════════════════════════════════
// GENERAL HELPERS
// ═══════════════════════════════════════════════════════════════════

const clampScore = (score: unknown): number => {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      5,
      Math.round(numericScore * 10) / 10
    )
  );
};

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter(
      (token) => token.length > 2
    );

const CATEGORY_KEYWORDS: Record<
  string,
  string[]
> = {
  DSA: [
    'complexity',
    'time',
    'space',
    'array',
    'linked',
    'hash',
    'tree',
    'stack',
    'queue',
    'recursion',
    'algorithm',
  ],

  SystemDesign: [
    'scale',
    'cache',
    'database',
    'load',
    'latency',
    'queue',
    'service',
    'api',
    'storage',
    'partition',
  ],

  DB: [
    'index',
    'query',
    'table',
    'schema',
    'transaction',
    'acid',
    'join',
    'normalization',
    'sql',
    'nosql',
  ],

  HR: [
    'experience',
    'team',
    'communication',
    'challenge',
    'learning',
    'strength',
    'weakness',
    'goal',
    'conflict',
  ],

  Project: [
    'architecture',
    'technology',
    'debug',
    'problem',
    'solution',
    'feature',
    'testing',
    'deployment',
    'impact',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

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
// ROBUST OLLAMA JSON PARSER
// ═══════════════════════════════════════════════════════════════════

/**
 * Ollama models can occasionally return:
 *
 * ```json
 * { ... }
 * ```
 *
 * or almost-valid JSON.
 *
 * This helper safely extracts JSON from the response.
 */
const extractJsonObject = (
  response: string
): string | null => {
  if (!response) {
    return null;
  }

  let text = response.trim();

  // Remove markdown code fences.
  text = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Direct JSON.
  if (
    text.startsWith('{') &&
    text.endsWith('}')
  ) {
    return text;
  }

  // Find the first opening brace.
  const start = text.indexOf('{');

  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (
    let i = start;
    i < text.length;
    i++
  ) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth++;
    }

    if (char === '}') {
      depth--;

      if (depth === 0) {
        return text.slice(
          start,
          i + 1
        );
      }
    }
  }

  return null;
};

/**
 * Attempts to repair a few common JSON formatting issues
 * produced by smaller local LLMs.
 */
const repairJson = (
  json: string
): string => {
  let repaired = json.trim();

  // Remove trailing commas before } or ].
  repaired = repaired.replace(
    /,\s*([}\]])/g,
    '$1'
  );

  // Normalize smart quotes.
  repaired = repaired
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  return repaired;
};

/**
 * Safely parse an Ollama JSON response.
 *
 * Returns null instead of throwing.
 */
const parseOllamaJson = (
  response: string
): any | null => {
  const extracted =
    extractJsonObject(response);

  if (!extracted) {
    console.error(
      '[Ollama JSON] No JSON object found in response.'
    );

    return null;
  }

  // Attempt 1: normal JSON parsing.
  try {
    return JSON.parse(extracted);
  } catch (firstError) {
    console.warn(
      '[Ollama JSON] Standard JSON parsing failed. Attempting repair...'
    );

    // Attempt 2: basic repair.
    try {
      const repaired =
        repairJson(extracted);

      return JSON.parse(repaired);
    } catch (secondError) {
      console.error(
        '[Ollama JSON] JSON repair failed:',
        secondError
      );

      console.error(
        '[Ollama JSON] Raw response:',
        response
      );

      return null;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// LOCAL ANSWER EVALUATION FALLBACK
// ═══════════════════════════════════════════════════════════════════

const evaluateAnswerLocally = (
  question: string,
  answer: string,
  category: string,
  idealAnswer?: string
): AnswerEvaluation => {
  const trimmedAnswer = answer.trim();

  const words = tokenize(trimmedAnswer);

  const uniqueWords = new Set(words);

  const idealTokens = tokenize(
    idealAnswer || ''
  );

  const questionTokens =
    tokenize(question);

  const categoryTokens =
    CATEGORY_KEYWORDS[category] || [];

  const allExpectedTokens = new Set([
    ...idealTokens,
    ...questionTokens,
    ...categoryTokens,
  ]);

  const matchedAll = [
    ...uniqueWords,
  ].filter((word) =>
    allExpectedTokens.has(word)
  ).length;

  const idealTokenSet =
    new Set(idealTokens);

  const matchedIdeal =
    idealTokens.length > 0
      ? [...uniqueWords].filter((word) =>
          idealTokenSet.has(word)
        ).length
      : 0;

  const idealCoverage =
    idealTokenSet.size > 0
      ? matchedIdeal / idealTokenSet.size
      : 0;

  const relevanceScore =
    Math.min(2, idealCoverage * 3);

  const keywordScore =
    Math.min(1, matchedAll * 0.15);

  const exampleScore =
    /\b(example|for instance|because|trade-?off|complexity|use case|in my project|we used|such as|like when)\b/i.test(
      trimmedAnswer
    )
      ? 0.5
      : 0;

  const structureScore =
    /[.!?]\s+\w/.test(trimmedAnswer) ||
    /first|second|then|finally|step/i.test(
      trimmedAnswer
    )
      ? 0.5
      : 0;

  const lengthGate =
    words.length >= 15
      ? 0.5
      : words.length >= 5
      ? 0.25
      : 0;

  const score = clampScore(
    0.5 +
      relevanceScore +
      keywordScore +
      exampleScore +
      structureScore +
      lengthGate
  );

  const strengths: string[] = [];

  if (idealCoverage >= 0.3) {
    strengths.push(
      'Your answer covers key concepts from the expected answer.'
    );
  }

  if (matchedAll >= 3) {
    strengths.push(
      `Good use of relevant ${category} terminology.`
    );
  }

  if (exampleScore > 0) {
    strengths.push(
      'Included practical examples or reasoning.'
    );
  }

  if (structureScore > 0) {
    strengths.push(
      'Well-structured, multi-sentence answer.'
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      'Answer was submitted clearly.'
    );
  }

  const improvements: string[] = [];

  if (idealCoverage < 0.3) {
    improvements.push(
      'Cover more key concepts that the question is asking about.'
    );
  }

  if (matchedAll < 3) {
    improvements.push(
      `Use more precise ${category} terminology in your answer.`
    );
  }

  if (exampleScore === 0) {
    improvements.push(
      'Add practical examples or reasoning to support your answer.'
    );
  }

  if (words.length < 15) {
    improvements.push(
      'Provide a more detailed and thorough answer.'
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      'Consider mentioning edge cases, limitations, or alternatives.'
    );
  }

  return {
    score,
    feedback:
      'Score is based on how well your answer matches the expected concepts, use of relevant terminology, examples, and structure.',

    strengths,

    improvements,

    idealAnswer:
      idealAnswer ||
      'A strong answer should explain the core concept, discuss trade-offs, and include a practical example.',

    followUpQuestion:
      `Can you elaborate further on the key concepts in your ${category} answer?`,
  };
};

// ═══════════════════════════════════════════════════════════════════
// OLLAMA AI INTEGRATION
// ═══════════════════════════════════════════════════════════════════

async function getAICompletion(
  prompt: string,
  systemPrompt: string =
    'You are Alex, a professional and friendly technical interviewer at a top tech company.',
  jsonMode = false
): Promise<string> {
  if (!USE_AI) {
    throw new Error(
      'Local AI is disabled.'
    );
  }

  const callAI = async (
    bail: (error: Error) => void,
    attempt: number
  ) => {
    console.log(
      `Ollama AI attempt ${attempt}`
    );

    try {
      const requestBody: Record<
        string,
        unknown
      > = {
        model: OLLAMA_CHAT_MODEL,

        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],

        stream: false,

        options: {
          temperature: jsonMode
            ? 0.2
            : 0.7,

          top_p: 0.9,
        },
      };

      // Ollama JSON mode.
      // This greatly reduces malformed JSON responses.
      if (jsonMode) {
        requestBody.format = 'json';
      }

      const response = await fetch(
        `${OLLAMA_BASE_URL}/api/chat`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

      if (!response.ok) {
        const errorBody =
          await response.text();

        console.error(
          `Ollama API HTTP ${response.status}:`,
          errorBody
        );

        const error = new Error(
          `Ollama API error: ${response.status}`
        );

        if (
          response.status >= 500
        ) {
          throw error;
        }

        bail(error);

        return '';
      }

      const data =
        (await response.json()) as {
          message?: {
            content?: string;
          };
        };

      const result =
        data.message?.content?.trim();

      if (!result) {
        throw new Error(
          'Empty response from Ollama'
        );
      }

      return result;
    } catch (error: any) {
      console.error(
        'Ollama API Error:',
        error?.message || error
      );

      throw error;
    }
  };

  try {
    return await retry(callAI, {
      retries: 2,

      minTimeout: 1000,

      maxTimeout: 3000,

      onRetry: (
        error: any,
        attempt: number
      ) => {
        console.log(
          `Retrying Ollama AI call, attempt ${attempt}:`,
          error?.message || error
        );
      },
    });
  } catch (error) {
    console.error(
      'All Ollama AI attempts failed:',
      error
    );

    throw new Error(
      'Local Ollama AI service temporarily unavailable'
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUESTION GENERATION — RAG + RESUME AWARE
// ═══════════════════════════════════════════════════════════════════

export const generateInterviewQuestion = async (
  category: string,
  difficulty: string,
  conversationHistory: any[] = [],
  resumeSkills?: string[],
  projectNames?: string[],
  jobRole?: string,
  interviewType?: string,
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
  }>,
  projectDescriptions?: Array<{
    name: string;
    description: string;
  }>,
  ragContext?: string
): Promise<GeneratedQuestion> => {
  try {
    const previousQuestions =
      conversationHistory
        .filter(
          (h) =>
            h.role === 'assistant' ||
            h.question
        )
        .map(
          (h) =>
            h.content || h.question
        )
        .filter(Boolean);

    const relevantResumeContext =
      ragContext?.trim()
        ? ragContext
        : 'No additional relevant resume context was retrieved.';

    const prompt = `You are conducting a real mock interview for a ${jobRole || 'software developer'} position.

CATEGORY: ${category}
DIFFICULTY: ${difficulty}
INTERVIEW TYPE: ${interviewType || 'technical'}

${
  resumeSkills?.length
    ? `CANDIDATE'S SKILLS (from resume): ${resumeSkills.join(', ')}`
    : ''
}

${
  projectDescriptions?.length
    ? `CANDIDATE'S PROJECTS:
${projectDescriptions
  .map(
    (p) =>
      `- ${p.name}: ${p.description}`
  )
  .join('\n')}`
    : projectNames?.length
    ? `CANDIDATE'S PROJECTS: ${projectNames.join(', ')}`
    : ''
}

${
  experience?.length
    ? `CANDIDATE'S EXPERIENCE:
${experience
  .map(
    (e) =>
      `- ${e.role} at ${e.company} (${e.duration})`
  )
  .join('\n')}`
    : ''
}

RELEVANT RESUME CONTEXT RETRIEVED USING RAG:
${relevantResumeContext}

IMPORTANT RAG RULES:
- The retrieved resume context comes from the candidate's uploaded resume.
- Use this context to make the question more specific and personalized.
- Prefer concrete technologies, projects, experiences, achievements, or responsibilities found in the retrieved context.
- Do NOT invent candidate experience, technologies, projects, companies, or achievements.
- If the retrieved context is not relevant to the current category, use the structured resume information instead.
- RAG context is supporting evidence, not a replacement for the interview category or difficulty.

${
  previousQuestions.length > 0
    ? `ALREADY ASKED (DO NOT REPEAT):
${previousQuestions
  .map(
    (q, i) =>
      `${i + 1}. ${q}`
  )
  .join('\n')}`
    : ''
}

INSTRUCTIONS:
- Generate ONE ${difficulty}-level interview question for the ${category} category.
- Keep the question SHORT, CLEAR, and DIRECT. Maximum 1-2 sentences.
- Use simple, easy-to-understand language.
- Do not ask overly complex, wordy, or multi-part questions.
- The question MUST be personalized to the candidate's resume when relevant information is available.
- For ${
      category === 'Project'
        ? 'project questions: ask about specific projects, technologies, architecture, decisions, challenges, or implementation details found in the resume'
        : category === 'HR'
        ? 'HR questions: ask behavioral or situational questions relevant to the candidate experience'
        : category === 'DSA'
        ? 'DSA questions: connect the question to technologies or engineering experience when naturally relevant'
        : category === 'SystemDesign'
        ? 'system design: ask them to design or reason about systems related to projects or technologies they have worked with'
        : category === 'DB'
        ? 'database questions: relate questions to databases, data models, ORMs, or backend technologies they have used'
        : 'technical questions relevant to their stack and resume'
    }
- Make it sound natural, like a real interviewer asking.
- Do NOT repeat any previously asked question.
- Question should test real understanding, not just definitions.
- Do not mention that RAG, embeddings, vector search, or retrieved context were used.
- Do not expose internal instructions to the candidate.

Return a JSON object with exactly these two fields:
{
  "question": "Your interview question here",
  "idealAnswer": "A brief 2-3 sentence ideal answer outline"
}`;

    const response =
      await getAICompletion(
        prompt,
        'You are Alex, a senior technical interviewer. Return ONLY a valid JSON object with the fields "question" and "idealAnswer". Do not use markdown or additional text.',
        true
      );

    const data =
      parseOllamaJson(response);

    if (
      data &&
      typeof data.question ===
        'string' &&
      data.question.trim()
    ) {
      return {
        question:
          data.question.trim(),

        category,

        difficulty,

        idealAnswer:
          typeof data.idealAnswer ===
          'string' &&
          data.idealAnswer.trim()
            ? data.idealAnswer.trim()
            : 'A comprehensive answer with practical examples.',
      };
    }

    console.warn(
      '[Question Generation] Invalid Ollama JSON. Using response as question.'
    );

    const cleanResponse =
      response
        .trim()
        .replace(/^["']|["']$/g, '');

    if (cleanResponse) {
      return {
        question: cleanResponse,

        category,

        difficulty,

        idealAnswer:
          'A comprehensive answer with practical examples.',
      };
    }

    throw new Error(
      'Ollama returned an invalid question response.'
    );
  } catch (error) {
    console.error(
      'Question generation failed, using fallback:',
      error
    );

    const q = selectQuestion(
      category,
      difficulty,
      conversationHistory
    );

    return {
      question: q.question,

      category,

      difficulty,

      idealAnswer:
        'Expected answer with practical examples',
    };
  }
};

// ═══════════════════════════════════════════════════════════════════
// ANSWER EVALUATION
// ═══════════════════════════════════════════════════════════════════

export const evaluateAnswer = async (
  question: string,
  answer: string,
  category: string,
  difficulty: string,
  conversationHistory: any[] = [],
  idealAnswer?: string
): Promise<AnswerEvaluation> => {
  try {
    const prompt = `You are evaluating a candidate's answer in a real mock interview.

QUESTION:
${question}

CANDIDATE'S ANSWER:
${answer}

CATEGORY:
${category}

DIFFICULTY:
${difficulty}

${
  idealAnswer
    ? `IDEAL ANSWER OUTLINE:
${idealAnswer}`
    : ''
}

EVALUATION CRITERIA:
- Technical accuracy and depth of knowledge
- Use of practical examples and real-world scenarios
- Communication clarity and structure
- Relevance to the question asked
- For ${difficulty} difficulty, expect ${
      difficulty === 'easy'
        ? 'basic understanding'
        : difficulty === 'medium'
        ? 'solid understanding with examples'
        : 'deep expertise with edge cases and trade-offs'
    }

Score from 1 to 5:
1 = Very weak / irrelevant
2 = Below average / vague
3 = Average / acceptable
4 = Good / solid understanding
5 = Excellent / comprehensive

IMPORTANT:
- Evaluate the actual candidate answer.
- Do not give a high score just because the answer is long.
- Do not invent things the candidate did not say.
- Be honest and constructive.
- Keep feedback concise.
- strengths must contain 1-3 short strings.
- improvements must contain 1-3 short strings.
- followUpQuestion must be one natural question.

Return ONLY a valid JSON object with EXACTLY these fields:

{
  "score": 3,
  "feedback": "Brief overall assessment of the candidate's answer.",
  "strengths": [
    "Strength one",
    "Strength two"
  ],
  "improvements": [
    "Improvement one",
    "Improvement two"
  ],
  "idealAnswer": "A strong 3-4 sentence answer to the question.",
  "followUpQuestion": "A deeper follow-up question based on the candidate's answer."
}

Do not include markdown.
Do not include explanations outside the JSON object.`;

    const responseText =
      await getAICompletion(
        prompt,
        'You are a professional technical interviewer AI. Return ONLY valid JSON. Never use markdown. Never add text outside the JSON object.',
        true
      );

    const data =
      parseOllamaJson(
        responseText
      );

    if (!data) {
      throw new Error(
        'Ollama evaluation returned invalid JSON.'
      );
    }

    const strengths =
      Array.isArray(
        data.strengths
      )
        ? data.strengths
            .filter(
              (item: unknown) =>
                typeof item ===
                'string'
            )
            .map(
              (item: string) =>
                item.trim()
            )
            .filter(Boolean)
            .slice(0, 3)
        : [];

    const improvements =
      Array.isArray(
        data.improvements
      )
        ? data.improvements
            .filter(
              (item: unknown) =>
                typeof item ===
                'string'
            )
            .map(
              (item: string) =>
                item.trim()
            )
            .filter(Boolean)
            .slice(0, 3)
        : [];

    const feedback =
      typeof data.feedback ===
        'string' &&
      data.feedback.trim()
        ? data.feedback.trim()
        : 'Evaluation completed.';

    const generatedIdealAnswer =
      typeof data.idealAnswer ===
        'string' &&
      data.idealAnswer.trim()
        ? data.idealAnswer.trim()
        : idealAnswer ||
          'A comprehensive technical answer with examples.';

    const followUpQuestion =
      typeof data.followUpQuestion ===
        'string' &&
      data.followUpQuestion.trim()
        ? data.followUpQuestion
            .trim()
            .replace(
              /^["']|["']$/g,
              ''
            )
        : 'Can you elaborate on that?';

    return {
      score: clampScore(
        data.score
      ),

      feedback,

      strengths:
        strengths.length > 0
          ? strengths
          : ['Answer was submitted.'],

      improvements:
        improvements.length > 0
          ? improvements
          : ['Add more detail.'],

      idealAnswer:
        generatedIdealAnswer,

      followUpQuestion,
    };
  } catch (error) {
    console.error(
      'Ollama Evaluation Error, using local fallback:',
      error
    );

    return evaluateAnswerLocally(
      question,
      answer,
      category,
      idealAnswer
    );
  }
};

// ═══════════════════════════════════════════════════════════════════
// FOLLOW-UP QUESTIONS
// ═══════════════════════════════════════════════════════════════════

export const generateFollowUpQuestion =
  async (
    previousQuestion: string,
    previousAnswer: string,
    category: string,
    conversationHistory: any[] = []
  ): Promise<string> => {
    try {
      const prompt = `In a mock interview, the candidate was asked:

"${previousQuestion}"

They answered:

"${previousAnswer}"

Generate ONE natural follow-up question that:
- Digs deeper into their answer
- Tests if they truly understand the concept
- Relates to the ${category} domain
- Sounds like a real interviewer probing further
- Does not repeat the original question

Output ONLY the follow-up question text, nothing else.`;

      const response =
        await getAICompletion(
          prompt
        );

      return response
        .trim()
        .replace(
          /^["']|["']$/g,
          ''
        )
        .replace(
          /^```.*\n?|\n?```$/g,
          ''
        )
        .trim();
    } catch (error) {
      console.error(
        'Follow-up generation failed:',
        error
      );

      return 'Can you explain your thought process behind that?';
    }
  };

// ═══════════════════════════════════════════════════════════════════
// GREETING & CLOSING
// ═══════════════════════════════════════════════════════════════════

export const getGreeting = async (
  candidateName?: string
): Promise<string> => {
  const name =
    candidateName?.trim() ||
    'there';

  return `Hi ${name}! Welcome to your mock interview. I'm Alex, your AI interviewer. Let's get started — remember, this is a safe space to practice, so take your time with each answer.`;
};

export const getClosingMessage =
  async (
    finalScore: number,
    strongAreas: string[],
    improvements: string[]
  ): Promise<string> => {
    try {
      const prompt = `A candidate just finished a mock interview with a score of ${finalScore.toFixed(
        1
      )}/5.

Strong areas:
${
  strongAreas.join(', ') ||
  'none identified'
}

Areas to improve:
${
  improvements.join(', ') ||
  'none identified'
}

Write a brief, encouraging closing message (2-3 sentences) as the interviewer "Alex".

Be specific about what they did well and what to work on.
Be motivating but honest.

Output ONLY the message text.`;

      return await getAICompletion(
        prompt
      );
    } catch {
      if (finalScore >= 4) {
        return `Great job! You showed excellent skills in ${
          strongAreas[0] ||
          'technical knowledge'
        }. Keep it up!`;
      }

      if (finalScore >= 3) {
        return `Good effort! Focus on ${
          improvements[0] ||
          'practicing more'
        } and you'll improve quickly.`;
      }

      return `Thank you for completing the interview! Keep practicing — every session makes you stronger.`;
    }
  };

// ═══════════════════════════════════════════════════════════════════
// FINAL REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════

export const generateFinalReport =
  async (
    questions: any[],
    bodyLanguageData?: any
  ): Promise<string> => {
    const validScores =
      questions.filter(
        (q) =>
          q.score !== undefined
      );

    const avgScore =
      validScores.length > 0
        ? validScores.reduce(
            (sum, q) =>
              sum + q.score,
            0
          ) /
          validScores.length
        : 0;

    let report =
      `# Interview Report\n\n`;

    report +=
      `## Overall Performance\n`;

    report +=
      `Average Score: ${avgScore.toFixed(
        1
      )}/5\n\n`;

    report +=
      `## Question Summary\n`;

    questions.forEach(
      (q, i) => {
        report += `Q${
          i + 1
        }: ${q.category} (${q.difficulty}) - Score: ${
          q.score !== undefined
            ? q.score
            : 'N/A'
        }/5\n`;
      }
    );

    report +=
      `\n## Recommendations\n`;

    const weakCategories =
      Array.from(
        new Set(
          questions
            .filter(
              (q) =>
                (q.score || 0) < 3
            )
            .map(
              (q) =>
                q.category
            )
        )
      );

    report += `- Continue practicing ${
      weakCategories.join(
        ', '
      ) ||
      'technical skills'
    }\n`;

    report +=
      `- Focus on communication skills\n`;

    report +=
      `- Practice more real interview scenarios\n`;

    return report;
  };