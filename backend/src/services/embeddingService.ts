const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

/**
 * Generate an embedding using Ollama running locally.
 *
 * This is completely local and does not require:
 * - OpenAI API key
 * - OpenAI credits
 * - Any paid embedding service
 */
export const generateEmbedding = async (
  text: string
): Promise<number[]> => {
  if (!text || !text.trim()) {
    throw new Error(
      'Cannot generate embedding for empty text.'
    );
  }

  try {
    const response = await fetch(
      `${OLLAMA_BASE_URL}/api/embeddings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: text.trim(),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Ollama embedding request failed (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as {
      embedding?: number[];
    };

    if (!data.embedding || data.embedding.length === 0) {
      throw new Error(
        'Ollama returned an empty embedding.'
      );
    }

    return data.embedding;
  } catch (error) {
    console.error(
      '[EmbeddingService] Failed to generate Ollama embedding:',
      error
    );

    throw error;
  }
};

/**
 * Generate embeddings for multiple text chunks.
 *
 * Ollama processes each chunk locally.
 * This avoids OpenAI API costs completely.
 */
export const generateEmbeddings = async (
  texts: string[]
): Promise<number[][]> => {
  const cleanedTexts = texts
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  if (cleanedTexts.length === 0) {
    return [];
  }

  try {
    const embeddings: number[][] = [];

    for (const text of cleanedTexts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  } catch (error) {
    console.error(
      '[EmbeddingService] Failed to generate Ollama embeddings:',
      error
    );

    throw error;
  }
};

/**
 * Calculate cosine similarity between two vectors.
 *
 * Result:
 *   1   = identical direction
 *   0   = unrelated
 *  -1   = opposite direction
 */
export const cosineSimilarity = (
  vectorA: number[],
  vectorB: number[]
): number => {
  if (vectorA.length !== vectorB.length) {
    throw new Error(
      `Embedding dimensions do not match: ${vectorA.length} vs ${vectorB.length}`
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return (
    dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  );
};