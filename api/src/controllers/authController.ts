import {type Request, type Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { type IUser } from '../models/user.model.js';
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, fullName: user.fullName },
      process.env.SECRET_KEY as string,
      { expiresIn: '1h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 
    });
    res.status(200).json({
      message: 'Login Successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};
const register = async (req : Request, res: Response) : Promise<void> =>{
    try{
        const { fullName, email, password, githubUsername , role} = req.body;
        const existingUser = await User.findOne({ email });
        if(existingUser){
            res.status(400).json({ error: 'User already exists with this email' });
            return;
        }
        const salt = bcryptjs.genSaltSync(10);
        const hashedPassword = bcryptjs.hashSync(password, salt);
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            githubUsername,
            role: role || 'hacker'
        });
        const { password: _, ...userWithoutPassword } = newUser.toObject();
        res.status(201).json(userWithoutPassword);
    } catch (error){
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export { register, login, logout };