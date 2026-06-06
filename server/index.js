import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import geminiRoutes from './routes/gemini.js';
import tasksRoutes from './routes/tasks.js';
import testsRoutes from './routes/tests.js';
import checkinsRoutes from './routes/checkins.js';
import auth from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB database connection established successfully.'))
  .catch((err) => {
    console.error('MongoDB database connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', auth, tasksRoutes);
app.use('/api/tests', auth, testsRoutes);
app.use('/api/checkins', auth, checkinsRoutes);
app.use('/api/gemini', geminiRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
