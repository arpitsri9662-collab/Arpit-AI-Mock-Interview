import mongoose from 'mongoose';
import connectDB from '../config/db';

/**
 * Cleanup script to drop the problematic clerkId unique index
 * This fixes the E11000 duplicate key error
 */
const dropOldIndex = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('Connected to database');

    const usersCollection = mongoose.connection.collection('users');
 
    // Get all indexes
    const indexes = await usersCollection.getIndexes();
    console.log('Current indexes:', indexes);

    // Drop the clerkId_1 index if it exists
    if (indexes['clerkId_1']) {
      await usersCollection.dropIndex('clerkId_1');
      console.log('OK Dropped old clerkId_1 index successfully');
    } else {
      console.log('OK clerkId_1 index not found (already clean)');
    }

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error dropping index:', error);
    process.exit(1);
  }
};

dropOldIndex();

