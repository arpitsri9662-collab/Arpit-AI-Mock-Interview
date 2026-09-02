import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedResume {
  skills: string[];
  projects: Array<{ name: string; description: string }>;
  experience: Array<{ company: string; role: string; duration: string }>;
}

const TECHNICAL_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
  'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
  'mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch', 'graphql', 'rest', 'api',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'linux', 'html', 'css',
  'tailwind', 'bootstrap', 'sql', 'nosql', 'machine learning', 'ai', 'data science',
  'typescript', 'nextjs', 'nuxt', 'svelte', 'flutter', 'react native', 'swift', 'kotlin'
];

const PROJECT_KEYWORDS = ['project', 'built', 'developed', 'created', 'implemented', 'designed'];
const EXPERIENCE_KEYWORDS = ['experience', 'work', 'intern', 'role', 'position', 'company'];

export const parseResume = async (filePath: string): Promise<ParsedResume> => {
  const ext = path.extname(filePath).toLowerCase();
  let text: string;

  if (ext === '.pdf') {
    text = await parsePDF(filePath);
  } else if (ext === '.docx') {
    text = await parseDOCX(filePath);
  } else {
    throw new Error('Unsupported file format. Only PDF and DOCX are supported.');
  }

  return extractInformation(text);
};

const parsePDF = async (filePath: string): Promise<string> => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

const parseDOCX = async (filePath: string): Promise<string> => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const extractInformation = (text: string): ParsedResume => {
  const lowerText = text.toLowerCase();
  
  const skills = extractSkills(lowerText);
  const projects = extractProjects(text);
  const experience = extractExperience(text);

  return { skills, projects, experience };
};

const extractSkills = (text: string): string[] => {
  const foundSkills: string[] = [];
  
  for (const skill of TECHNICAL_SKILLS) {
    if (text.includes(skill)) {
      foundSkills.push(skill);
    }
  }

  const skillSections = text.match(/(?:skills|technical skills|technologies)[\s:]*([\s\S]*?)(?:\n\n|$)/gi);
  if (skillSections) {
    for (const section of skillSections) {
      const skills = section.split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(s => s.length > 2);
      for (const skill of skills) {
        if (!foundSkills.includes(skill) && TECHNICAL_SKILLS.some(ts => skill.includes(ts))) {
          foundSkills.push(skill);
        }
      }
    }
  }

  return [...new Set(foundSkills)];
};

// ═══════════════════════════════════════════════════════════════════
// RESUME ANALYSIS — Gemini-powered real-time analysis
// ═══════════════════════════════════════════════════════════════════

export interface ResumeAnalysis {
  suitabilityScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

const GEMINI_MODEL = 'gemini-flash-latest';

/**
 * Analyze resume suitability using Gemini AI for real, intelligent analysis.
 * Falls back to local keyword matching if AI is unavailable.
 */
export const analyzeResumeSuitability = async (
  parsedData: ParsedResume,
  role: string
): Promise<ResumeAnalysis> => {
  // Try AI-powered analysis first
  if (process.env.GEMINI_API_KEY) {
    try {
      return await analyzeWithGemini(parsedData, role);
    } catch (error) {
      console.error('[ResumeAnalysis] Gemini analysis failed, using local fallback:', error);
    }
  }

  // Fallback to local analysis
  return analyzeLocally(parsedData, role);
};

/**
 * Real-time Gemini-powered resume analysis
 */
async function analyzeWithGemini(parsedData: ParsedResume, role: string): Promise<ResumeAnalysis> {
  const roleLabels: Record<string, string> = {
    frontend: 'Frontend Developer',
    backend: 'Backend Developer',
    fullstack: 'Full Stack Developer',
    mern: 'MERN Stack Developer',
    mevn: 'MEVN Stack Developer',
    mobile: 'Mobile App Developer',
    dse: 'Data Science Engineer',
    da: 'Data Analyst',
    ds: 'DevOps / SRE Engineer',
    devops: 'Cloud Engineer',
    qa: 'QA / Test Automation Engineer',
  };

  const roleLabel = roleLabels[role.toLowerCase()] || role;

  const prompt = `You are a senior tech recruiter and resume analyst. Analyze this candidate's resume data for the role of "${roleLabel}".

CANDIDATE'S SKILLS: ${parsedData.skills.join(', ') || 'None listed'}

CANDIDATE'S PROJECTS:
${parsedData.projects.length > 0
    ? parsedData.projects.map(p => `- ${p.name}: ${p.description}`).join('\n')
    : 'No projects listed'}

CANDIDATE'S EXPERIENCE:
${parsedData.experience.length > 0
    ? parsedData.experience.map(e => `- ${e.role} at ${e.company} (${e.duration})`).join('\n')
    : 'No experience listed'}

TARGET ROLE: ${roleLabel}

Provide a thorough analysis. Be specific about WHY skills match or don't match. Consider:
- How well the candidate's skills align with ${roleLabel} requirements
- Whether their projects demonstrate relevant experience
- Gaps in their skill set for this specific role
- Actionable recommendations to improve their profile

Respond with ONLY this JSON (no markdown, no extra text):
{
  "suitabilityScore": <number 0-100>,
  "matchedSkills": ["<skill 1 with brief reason>", "<skill 2 with brief reason>"],
  "missingSkills": ["<missing skill 1 — why it matters>", "<missing skill 2 — why it matters>"],
  "recommendations": ["<specific actionable recommendation 1>", "<specific actionable recommendation 2>", "<specific actionable recommendation 3>"]
}

IMPORTANT:
- suitabilityScore should reflect realistic assessment (not just skill count)
- matchedSkills should list skills they HAVE that are relevant to ${roleLabel}
- missingSkills should list critical skills they LACK for ${roleLabel}
- recommendations should be specific and actionable (not generic)`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new Error('Empty response from Gemini');
  }

  // Parse JSON from response
  const jsonMatch = resultText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response');
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    suitabilityScore: Math.max(0, Math.min(100, Math.round(Number(analysis.suitabilityScore) || 0))),
    matchedSkills: Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills : [],
    missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
    recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
  };
}

/**
 * Local fallback analysis (keyword matching)
 */
function analyzeLocally(parsedData: ParsedResume, role: string): ResumeAnalysis {
  const roleSkills: Record<string, string[]> = {
    frontend: ['javascript', 'typescript', 'react', 'vue', 'angular', 'html', 'css', 'tailwind'],
    backend: ['nodejs', 'python', 'java', 'express', 'django', 'spring', 'sql', 'mongodb'],
    fullstack: ['javascript', 'typescript', 'react', 'nodejs', 'express', 'sql', 'mongodb'],
    mern: ['mongodb', 'express', 'react', 'nodejs'],
    mevn: ['mongodb', 'express', 'vue', 'nodejs'],
    mobile: ['react native', 'flutter', 'swift', 'kotlin'],
    dse: ['python', 'machine learning', 'tensorflow', 'pandas', 'numpy', 'scikit-learn'],
    da: ['sql', 'python', 'excel', 'tableau', 'power bi', 'pandas'],
    ds: ['docker', 'kubernetes', 'aws', 'azure', 'jenkins', 'terraform'],
    devops: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
    qa: ['selenium', 'cypress', 'jest', 'testing', 'automation']
  };

  const requiredSkills = roleSkills[role.toLowerCase()] || [];
  const resumeSkills = parsedData.skills.map(s => s.toLowerCase());

  const matchedSkills = requiredSkills.filter(skill => resumeSkills.includes(skill));
  const missingSkills = requiredSkills.filter(skill => !resumeSkills.includes(skill));

  const suitabilityScore = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0;

  const recommendations = [];
  if (suitabilityScore < 50) {
    recommendations.push('Consider gaining more experience in core technologies for this role.');
  }
  if (missingSkills.length > 0) {
    recommendations.push(`Focus on learning: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  if (parsedData.projects.length < 2) {
    recommendations.push('Add more relevant projects to showcase your skills.');
  }
  if (parsedData.experience.length === 0) {
    recommendations.push('Highlight your professional experience more prominently.');
  }

  return {
    suitabilityScore,
    matchedSkills,
    missingSkills,
    recommendations,
  };
}

const extractProjects = (text: string): Array<{ name: string; description: string }> => {
  const projects: Array<{ name: string; description: string }> = [];
  const lines = text.split('\n');
  
  let inProjectSection = false;
  let currentProject: { name: string; description: string } | null = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    if (PROJECT_KEYWORDS.some(kw => lowerLine.includes(kw)) && lowerLine.length < 100) {
      inProjectSection = true;
      currentProject = { name: line.trim(), description: '' };
    } else if (inProjectSection && currentProject && line.trim().length > 20) {
      currentProject.description += ' ' + line.trim();
    } else if (inProjectSection && currentProject && currentProject.description && line.trim().length === 0) {
      if (currentProject.description.length > 10) {
        projects.push(currentProject);
      }
      currentProject = null;
      inProjectSection = false;
    }
  }

  if (currentProject && currentProject.description.length > 10) {
    projects.push(currentProject);
  }

  return projects.slice(0, 5);
};

const extractExperience = (text: string): Array<{ company: string; role: string; duration: string }> => {
  const experience: Array<{ company: string; role: string; duration: string }> = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    if (EXPERIENCE_KEYWORDS.some(kw => lowerLine.includes(kw)) && line.length < 80) {
      const parts = line.split(/[-–]/);
      if (parts.length >= 1) {
        experience.push({
          company: parts[0].replace(EXPERIENCE_KEYWORDS.join('|'), '').trim(),
          role: parts.length > 1 ? parts[1].trim() : '',
          duration: parts.length > 2 ? parts[2].trim() : '',
        });
      }
    }
  }

  return experience.slice(0, 5);
};