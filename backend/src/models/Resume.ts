import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  filePath: string;
  parsedData: {
    skills: string[];
    projects: Array<{ name: string; description: string }>;
    experience: Array<{ company: string; role: string; duration: string }>;
  };
  createdAt: Date;
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
    parsedData: {
      skills: [String],
      projects: [
        {
          name: String,
          description: String,
        },
      ],
      experience: [
        {
          company: String,
          role: String,
          duration: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IResume>('Resume', resumeSchema);