import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  jwtSecret: string;
  mongoUri: string;
  port: number;
  nodeEnv: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
}

// Validate required environment variables
const validateEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const config: Config = {
  jwtSecret: validateEnv('JWT_SECRET', 'development-jwt-secret-key-change-in-production'),
  mongoUri: process.env.MONGODB_URI || process.env.DB_URL || 'mongodb://localhost:27017/ai-interview',
  port: parseInt(process.env.PORT || '5005', 10), // Changed default to 5005
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
};

console.log('--- Configuration Loaded ---');
console.log(`Port: ${config.port}`);
console.log(`Environment: ${config.nodeEnv}`);
console.log(`Database: ${config.mongoUri.split('@').pop()}`); // Log only host for security
console.log(`AI: ${config.geminiApiKey ? 'Gemini ✅' : 'No Gemini'} | ${config.openaiApiKey ? 'OpenAI ✅' : 'No OpenAI'}`);
console.log('---------------------------');

export default config;