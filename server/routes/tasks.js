import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// GET /api/tasks - Get all tasks for logged in user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Server error fetching tasks.' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, status } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    const newTask = new Task({
      user: req.userId,
      title,
      status: status || 'Not Started'
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: 'Server error creating task.' });
  }
});

// PUT /api/tasks/:id - Update task status or title
router.put('/:id', async (req, res) => {
  try {
    const { title, status } = req.body;
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (title !== undefined) task.title = title;
    if (status !== undefined) task.status = status;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error updating task.' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error deleting task.' });
  }
});

export default router;
