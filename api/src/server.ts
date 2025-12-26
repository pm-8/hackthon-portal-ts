import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js'
dotenv.config();
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n===================================`);
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===================================\n`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
startServer();