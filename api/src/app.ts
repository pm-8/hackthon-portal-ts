import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import teamRoutes from './routes/team.routes.js';
import githubRoutes from './routes/github.routes.js';
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Hackathon Manager API is running',
    timestamp: new Date().toISOString()
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/github', githubRoutes);
// app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });
export default app;