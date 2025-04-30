import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js'; // Import the new route

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust as needed for production)
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/users', userRoutes);
app.use('/api/telegram', telegramRoutes); // Use the new Telegram route

// Basic root route
app.get('/', (req, res) => {
  res.send('MemeX Backend API');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
