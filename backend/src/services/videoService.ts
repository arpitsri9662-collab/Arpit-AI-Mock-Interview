import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const videoUploadsRoot = path.join(__dirname, '..', '..', 'uploads', 'videos');

const getInterviewVideoDir = (interviewId: string): string => {
  return path.join(videoUploadsRoot, interviewId);
};

export const saveVideoChunk = async (
  interviewId: string,
  chunk: Buffer,
  chunkIndex: number
): Promise<string> => {
  const uploadDir = getInterviewVideoDir(interviewId);

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const chunkPath = path.join(uploadDir, `chunk-${chunkIndex}.webm`);
  await fs.writeFile(chunkPath, chunk);

  return chunkPath;
};

export const combineVideoChunks = async (
  interviewId: string,
  totalChunks: number
): Promise<string> => {
  const uploadDir = getInterviewVideoDir(interviewId);
  const outputPath = path.join(uploadDir, `${interviewId}.webm`);

  const writeStream = fsSync.createWriteStream(outputPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(uploadDir, `chunk-${i}.webm`);
    try {
      await fs.access(chunkPath);
      const readStream = fsSync.createReadStream(chunkPath);
      await new Promise((resolve, reject) => {
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', () => resolve(null));
        readStream.on('error', reject);
      });
    } catch (error) {
      // Chunk might not exist, skip
    }
  }

  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
};

export const deleteVideoChunks = async (interviewId: string): Promise<void> => {
  const uploadDir = getInterviewVideoDir(interviewId);

  try {
    const files = await fs.readdir(uploadDir);
    await Promise.all(files.map(file => fs.unlink(path.join(uploadDir, file))));
    await fs.rmdir(uploadDir);
  } catch (error) {
    // Directory might not exist or already deleted
  }
};

export const getVideoPath = (interviewId: string): string => {
  return path.join(getInterviewVideoDir(interviewId), `${interviewId}.webm`);
};

export const videoExists = async (interviewId: string): Promise<boolean> => {
  const videoPath = getVideoPath(interviewId);
  try {
    await fs.access(videoPath);
    return true;
  } catch {
    return false;
  }
};

export const analyzeBodyLanguage = async (
  frameData: string
): Promise<{ confidenceScore: number; suggestions: string[] }> => {
  throw new Error('Body language analysis is not configured. No analysis was generated.');
};
