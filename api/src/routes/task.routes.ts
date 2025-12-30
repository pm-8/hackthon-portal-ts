import express from 'express';
import { createTask, getTasks, updateTaskStatus, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected (must be logged in)
router.post('/create', protect, createTask);
router.get('/:teamId', protect, getTasks);
router.patch('/:taskId/status', protect, updateTaskStatus); // updates just the status
router.delete('/:taskId', protect, deleteTask);

export default router;