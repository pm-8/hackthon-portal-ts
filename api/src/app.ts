import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// TODO: Import your route files here once you create them
import authRoutes from './routes/auth.routes.js';
// import teamRoutes from './routes/team.routes';
// import githubRoutes from './routes/github.routes';

const app: Application = express();

// ==========================
// Global Middleware
// ==========================
// 1. Body Parsers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies (needed for your auth token)

// 2. Security & Logging
app.use(helmet()); // Secure HTTP headers
app.use(morgan('dev')); // Request logging

// 3. CORS Configuration
app.use(cors({
  origin: "http://localhost:5173", // Your frontend URL
  credentials: true, // Allow cookies to be sent/received
}));

// ==========================
// Routes
// ==========================

// Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Hackathon Manager API is running 🚀',
    timestamp: new Date().toISOString()
  });
});

// API Routes (Uncomment these as you create the files)
app.use('/api/auth', authRoutes);
// app.use('/api/teams', teamRoutes);
// app.use('/api/github', githubRoutes);

// Global Error Handler (Optional but recommended)
// app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });
export default app;