import express from 'express';
import Test from '../models/Test.js';

const router = express.Router();

// GET /api/tests - Get all tests for logged in user
router.get('/', async (req, res) => {
  try {
    const tests = await Test.find({ user: req.userId }).sort({ dateTime: 1 });
    res.json(tests);
  } catch (err) {
    console.error('Error fetching tests:', err);
    res.status(500).json({ message: 'Server error fetching tests.' });
  }
});

// POST /api/tests - Schedule a new test
router.post('/', async (req, res) => {
  try {
    const { name, type, dateTime, totalMarks, description, status } = req.body;
    if (!name || !dateTime || !totalMarks) {
      return res.status(400).json({ message: 'Name, dateTime, and totalMarks are required.' });
    }

    const newTest = new Test({
      user: req.userId,
      name,
      type,
      dateTime,
      totalMarks,
      description,
      status: status || (new Date(dateTime) <= new Date() ? 'ongoing' : 'upcoming')
    });

    await newTest.save();
    res.status(201).json(newTest);
  } catch (err) {
    console.error('Error creating test:', err);
    res.status(500).json({ message: 'Server error creating test.' });
  }
});

// PUT /api/tests/:id - Update test results or details
router.put('/:id', async (req, res) => {
  try {
    const { status, score, percentage, rank, percentile, emotionalTag, completedAt } = req.body;
    const test = await Test.findOne({ _id: req.params.id, user: req.userId });

    if (!test) {
      return res.status(404).json({ message: 'Test not found.' });
    }

    if (status !== undefined) test.status = status;
    if (score !== undefined) test.score = score;
    if (percentage !== undefined) test.percentage = percentage;
    if (rank !== undefined) test.rank = rank;
    if (percentile !== undefined) test.percentile = percentile;
    if (emotionalTag !== undefined) test.emotionalTag = emotionalTag;
    if (completedAt !== undefined) test.completedAt = completedAt;

    await test.save();
    res.json(test);
  } catch (err) {
    console.error('Error updating test:', err);
    res.status(500).json({ message: 'Server error updating test.' });
  }
});

// DELETE /api/tests/:id - Delete a test
router.delete('/:id', async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!test) {
      return res.status(404).json({ message: 'Test not found.' });
    }
    res.json({ message: 'Test deleted successfully.' });
  } catch (err) {
    console.error('Error deleting test:', err);
    res.status(500).json({ message: 'Server error deleting test.' });
  }
});

export default router;
