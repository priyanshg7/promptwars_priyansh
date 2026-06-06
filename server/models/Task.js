import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Done', 'Skipped'],
    default: 'Not Started'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Task', TaskSchema);
