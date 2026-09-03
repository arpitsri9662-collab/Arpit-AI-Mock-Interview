import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  filePath: string;

  // Full extracted resume text used for RAG
  resumeText: string;

  parsedData: {
    skills: string[];
    projects: Array<{
      name: string;
      description: string;
    }>;
    experience: Array<{
      company: string;
      role: string;
      duration: string;
    }>;
  };

  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    // Store the original extracted resume text.
    // This is the source text that will later be chunked
    // and converted into embeddings for RAG.
    resumeText: {
      type: String,
      required: true,
    },

    parsedData: {
      skills: {
        type: [String],
        default: [],
      },

      projects: {
        type: [
          {
            name: {
              type: String,
              default: '',
            },
            description: {
              type: String,
              default: '',
            },
          },
        ],
        default: [],
      },

      experience: {
        type: [
          {
            company: {
              type: String,
              default: '',
            },
            role: {
              type: String,
              default: '',
            },
            duration: {
              type: String,
              default: '',
            },
          },
        ],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IResume>('Resume', resumeSchema);