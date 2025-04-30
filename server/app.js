console.log('Starting server/app.js...');
import express from 'express';
console.log('Imported express');
import cors from 'cors';
console.log('Imported cors');
import userRoutes from './routes/userRoutes.js';
console.log('Imported userRoutes');
import telegramRoutes from './routes/telegramRoutes.js'; // Import the new route
console.log('Imported telegramRoutes');

const app = express();
console.log('Express app created');
const port = process.env.PORT || 3000;
console.log(`Using port: ${port}`);

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust as needed for production)
console.log('CORS middleware added');
app.use(express.json()); // Parse JSON request bodies
console.log('JSON middleware added');

// Routes
app.use('/api/users', userRoutes);
console.log('User routes added');
app.use('/api/telegram', telegramRoutes); // Use the new Telegram route
console.log('Telegram routes added');

// Basic root route
app.get('/', (req, res) => {
  res.send('MemeX Backend API');
});
console.log('Root route added');

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
console.log('App listening...');
