import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    default: ""
  },
  targetExams: [{
    type: String
  }],
  examDates: {
    type: Map,
    of: String,
    default: {}
  },
  language: {
    type: String,
    default: "en"
  },
  onboarded: {
    type: Boolean,
    default: false
  },
  burnoutScore: {
    type: Number,
    default: 40
  },
  day0Baseline: {
    sleep: Number,
    confidence: Number,
    studyHours: Number,
    createdAt: Date
  },
  lastCheckinDate: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', UserSchema);

