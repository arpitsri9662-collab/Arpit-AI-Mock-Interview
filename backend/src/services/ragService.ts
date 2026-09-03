import mongoose from 'mongoose';
import ResumeChunk from '../models/ResumeChunk';
import {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
} from './embeddingService';

interface RetrievedChunk {
  content: string;
  score: number;
  chunkIndex: number;
  metadata?: {
    section?: string;
  };
}

interface CreateChunksOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 150;

/**
 * Split resume text into overlapping chunks.
 *
 * Example:
 *
 * Chunk 1: characters 0 - 800
 * Chunk 2: characters 650 - 1450
 * Chunk 3: characters 1300 - 2100
 *
 * The overlap prevents important information from being
 * lost at chunk boundaries.
 */
export const chunkText = (
  text: string,
  options: CreateChunksOptions = {}
): string[] => {
  const chunkSize =
    options.chunkSize || DEFAULT_CHUNK_SIZE;

  const chunkOverlap =
    options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;

  if (!text || !text.trim()) {
    return [];
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error(
      'chunkOverlap must be smaller than chunkSize.'
    );
  }

  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  const chunks: string[] = [];

  let start = 0;

  while (start < cleanedText.length) {
    let end = Math.min(
      start + chunkSize,
      cleanedText.length
    );

    let chunk = cleanedText.slice(start, end).trim();

    /*
     * Try to end chunks at a natural boundary instead of
     * cutting a sentence in half.
     */
    if (end < cleanedText.length) {
      const lastParagraphBreak = chunk.lastIndexOf('\n\n');
      const lastLineBreak = chunk.lastIndexOf('\n');
      const lastSentence = Math.max(
        chunk.lastIndexOf('. '),
        chunk.lastIndexOf('? '),
        chunk.lastIndexOf('! ')
      );

      const naturalBreak = Math.max(
        lastParagraphBreak,
        lastLineBreak,
        lastSentence
      );

      // Only move the boundary if we found a useful break.
      if (naturalBreak > chunkSize * 0.5) {
        end = start + naturalBreak + 1;
        chunk = cleanedText.slice(start, end).trim();
      }
    }

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (end >= cleanedText.length) {
      break;
    }

    start = Math.max(
      end - chunkOverlap,
      start + 1
    );
  }

  return chunks;
};

/**
 * Determine a basic section name from resume text.
 *
 * This is intentionally simple. The semantic embedding is still
 * responsible for the actual relevance matching.
 */
const detectSection = (text: string): string | undefined => {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes('experience') ||
    lowerText.includes('employment') ||
    lowerText.includes('work history')
  ) {
    return 'experience';
  }

  if (
    lowerText.includes('project') ||
    lowerText.includes('projects')
  ) {
    return 'projects';
  }

  if (
    lowerText.includes('skill') ||
    lowerText.includes('technology') ||
    lowerText.includes('technical skills')
  ) {
    return 'skills';
  }

  if (
    lowerText.includes('education') ||
    lowerText.includes('academic')
  ) {
    return 'education';
  }

  if (
    lowerText.includes('certification') ||
    lowerText.includes('certifications')
  ) {
    return 'certifications';
  }

  return undefined;
};

/**
 * Create embeddings and save all resume chunks in MongoDB.
 *
 * Existing chunks for the resume are deleted first so that
 * re-uploading/re-processing a resume does not create duplicates.
 */
export const createResumeChunks = async (
  resumeId: mongoose.Types.ObjectId | string,
  userId: mongoose.Types.ObjectId | string,
  resumeText: string,
  options: CreateChunksOptions = {}
): Promise<number> => {
  if (!resumeText || !resumeText.trim()) {
    throw new Error(
      'Resume text is empty. Cannot create RAG chunks.'
    );
  }

  const chunks = chunkText(resumeText, options);

  if (chunks.length === 0) {
    throw new Error(
      'No chunks could be created from the resume.'
    );
  }

  console.log(
    `[RAG] Creating ${chunks.length} chunks for resume ${resumeId}`
  );

  // Remove old chunks if this resume is being processed again.
  await ResumeChunk.deleteMany({
    resumeId,
  });

  // Generate embeddings for all chunks.
  const embeddings = await generateEmbeddings(chunks);

  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Embedding count mismatch. Expected ${chunks.length}, received ${embeddings.length}.`
    );
  }

  const documents = chunks.map((content, index) => ({
    resumeId,
    userId,
    content,
    embedding: embeddings[index],
    chunkIndex: index,
    metadata: {
      section: detectSection(content),
    },
  }));

  await ResumeChunk.insertMany(documents);

  console.log(
    `[RAG] Successfully stored ${documents.length} chunks for resume ${resumeId}`
  );

  return documents.length;
};

/**
 * Retrieve the most relevant resume chunks for a query.
 *
 * This implementation performs cosine similarity in Node.js.
 * That means it works with normal/local MongoDB as well as
 * MongoDB Atlas without requiring Atlas Vector Search.
 */
export const retrieveRelevantChunks = async (
  resumeId: mongoose.Types.ObjectId | string,
  query: string,
  topK = 5,
  minimumScore = 0.25
): Promise<RetrievedChunk[]> => {
  if (!query || !query.trim()) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);

  // Fetch chunks belonging only to this resume.
  const chunks = await ResumeChunk.find({
    resumeId,
  }).lean();

  if (chunks.length === 0) {
    console.warn(
      `[RAG] No chunks found for resume ${resumeId}`
    );

    return [];
  }

  const scoredChunks = chunks
    .map((chunk) => ({
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      metadata: chunk.metadata,
      score: cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      ),
    }))
    .filter((chunk) => chunk.score >= minimumScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  console.log(
    `[RAG] Retrieved ${scoredChunks.length} relevant chunks for query`
  );

  return scoredChunks;
};

/**
 * Convert retrieved chunks into a clean context string
 * that can be inserted into the AI prompt.
 */
export const buildRAGContext = (
  chunks: RetrievedChunk[]
): string => {
  if (!chunks.length) {
    return 'No relevant resume context was found.';
  }

  return chunks
    .map(
      (chunk, index) =>
        `[Resume Context ${index + 1}]\n${chunk.content}`
    )
    .join('\n\n');
};

/**
 * Convenience function:
 *
 * Query → embedding → retrieve chunks → formatted context
 */
export const getResumeContext = async (
  resumeId: mongoose.Types.ObjectId | string,
  query: string,
  topK = 5
): Promise<string> => {
  const chunks = await retrieveRelevantChunks(
    resumeId,
    query,
    topK
  );

  return buildRAGContext(chunks);
};

/**
 * Delete all RAG chunks associated with a resume.
 *
 * This should be called when a resume is permanently deleted.
 */
export const deleteResumeChunks = async (
  resumeId: mongoose.Types.ObjectId | string
): Promise<void> => {
  const result = await ResumeChunk.deleteMany({
    resumeId,
  });

  console.log(
    `[RAG] Deleted ${result.deletedCount || 0} chunks for resume ${resumeId}`
  );
};