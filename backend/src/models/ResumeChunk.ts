import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeChunk extends Document {
  resumeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // The actual piece of resume text
  content: string;

  // Vector representation of the chunk
  embedding: number[];

  // Position of the chunk in the original resume
  chunkIndex: number;

  // Optional metadata to make retrieval more useful
  metadata?: {
    section?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const resumeChunkSchema = new Schema<IResumeChunk>(
  {
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    metadata: {
      section: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Quickly retrieve all chunks belonging to a resume
resumeChunkSchema.index({
  resumeId: 1,
  chunkIndex: 1,
});

// Quickly retrieve chunks belonging to a user's resumes
resumeChunkSchema.index({
  userId: 1,
  resumeId: 1,
});

export default mongoose.model<IResumeChunk>(
  'ResumeChunk',
  resumeChunkSchema
);