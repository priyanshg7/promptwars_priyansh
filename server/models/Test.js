import mongoose from 'mongoose';

const TestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  score: {
    type: Number,
    default: null
  },
  percentage: {
    type: Number,
    default: null
  },
  rank: {
    type: Number,
    default: null
  },
  percentile: {
    type: Number,
    default: null
  },
  emotionalTag: {
    type: String,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Test', TestSchema);
