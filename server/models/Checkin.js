import mongoose from 'mongoose';

const CheckinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  primaryEmotion: {
    type: String,
    required: true
  },
  subEmotion: {
    type: String,
    required: true
  },
  sleep: {
    type: Number,
    required: true
  },
  energy: {
    type: Number,
    required: true
  },
  motivation: {
    type: Number,
    required: true
  },
  reactionTime: {
    type: Number,
    required: true
  },
  burnoutScoreCalculated: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Checkin', CheckinSchema);
