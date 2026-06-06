import express from 'express';
import Checkin from '../models/Checkin.js';

const router = express.Router();

// GET /api/checkins - Get all checkins for logged in user
router.get('/', async (req, res) => {
  try {
    const checkins = await Checkin.find({ user: req.userId }).sort({ createdAt: 1 });
    res.json(checkins);
  } catch (err) {
    console.error('Error fetching checkins:', err);
    res.status(500).json({ message: 'Server error fetching checkins.' });
  }
});

// POST /api/checkins - Log a new check-in
router.post('/', async (req, res) => {
  try {
    const { primaryEmotion, subEmotion, sleep, energy, motivation, reactionTime, burnoutScoreCalculated } = req.body;
    
    if (!primaryEmotion || !subEmotion) {
      return res.status(400).json({ message: 'Primary and sub-emotions are required.' });
    }

    const newCheckin = new Checkin({
      user: req.userId,
      primaryEmotion,
      subEmotion,
      sleep: sleep || 5,
      energy: energy || 5,
      motivation: motivation || 5,
      reactionTime: reactionTime || 250,
      burnoutScoreCalculated: burnoutScoreCalculated || 40
    });

    await newCheckin.save();
    res.status(201).json(newCheckin);
  } catch (err) {
    console.error('Error creating checkin:', err);
    res.status(500).json({ message: 'Server error creating checkin.' });
  }
});

export default router;
