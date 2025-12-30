import { type Response } from 'express';
import { Types } from 'mongoose';
import Task from '../models/task.model.js';
import Team from '../models/team.model.js';
import {type AuthRequest } from '../middleware/auth.middleware.js'; // Check your path for this import

// Helper: Ensure the user actually belongs to the team they are editing
// src/controllers/task.controller.ts

const verifyTeamMember = async (userId: string, teamId: string) => {
  const team = await Team.findById(teamId);
  if (!team) return false;

  // DEBUGGING LOGS (Remove these after fixing)
  console.log("Checking permissions...");
  console.log("User ID trying to post:", userId);
  console.log("Team Members found:", team.teamMembers);
  
  const members = team.teamMembers.map(m => m.toString());
  return members.includes(userId);
};

// 1. Create a New Task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, title, description } = req.body;
    
    // Security: Check if user is in the team
    const isMember = await verifyTeamMember(req.user!.id, teamId);
    if (!isMember) return res.status(403).json({ error: 'Not authorized for this team' });

    const newTask = await Task.create({
      teamId, // Uses the ID passed from frontend
      title,
      description
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};
// 2. Get All Tasks for a Team
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const tasks = await Task.find({ teamId: new Types.ObjectId(teamId) });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// 3. Update Task Status (Drag & Drop)
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body; // 'todo', 'in-progress', or 'done'

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Security Check
    const isMember = await verifyTeamMember(req.user!.id, task.teamId.toString());
    if (!isMember) return res.status(403).json({ error: 'Not authorized' });

    task.status = status;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// 4. Delete Task
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Security Check
    const isMember = await verifyTeamMember(req.user!.id, task.teamId.toString());
    if (!isMember) return res.status(403).json({ error: 'Not authorized' });

    await task.deleteOne();
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};