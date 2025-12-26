import {type Request, type Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { type IUser } from '../models/user.model.js';

// --- Register User ---
// export const register = async (req: Request, res: Response) => {
//   try {
//     const { fullName, email, password, githubUsername, role } = req.body;

//     // 1. Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists with this email' });
//     }

//     // 2. Hash Password
//     const salt = bcryptjs.genSaltSync(10);
//     const hashedPassword = bcryptjs.hashSync(password, salt);

//     // 3. Create User (Role defaults to 'hacker' if not provided)
//     const newUser = await User.create({
//       fullName,
//       email,
//       password: hashedPassword,
//       githubUsername,
//       role: role || 'hacker' 
//     });

//     // 4. Send Response (excluding password)
//     // We cast to 'any' briefly to safely omit password from the response object if strict
//     const { password: _, ...userWithoutPassword } = newUser.toObject();
    
//     res.status(201).json(userWithoutPassword);

//   } catch (error) {
//     console.error('Registration Error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// // --- Login User ---
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body; // Changed to email (better practice than fullName)

    // 1. Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    // 2. Check Password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    // 3. Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role, fullName: user.fullName },
      process.env.SECRET_KEY as string,
      { expiresIn: '1h' }
    );

    // 4. Send Cookie & Response
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production only
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
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

// --- Logout User ---
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