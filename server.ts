import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import TelegramBot from 'node-telegram-bot-api'; // Import TelegramBot here

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'dist' directory (where Vite builds the frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// --- Telegram Bot Logic (Server-side) ---
// Replace with your actual Telegram Bot Token from environment variables
const token = process.env.VITE_TELEGRAM_BOT_TOKEN; // Access token from server env

// Replace with the actual chat ID (group ID or bot username/ID)
const targetChatId = '-100123456789'; // <<< REPLACE WITH YOUR ACTUAL CHAT ID

const bot = token ? new TelegramBot(token, { polling: false }) : null;

if (!bot) {
  console.error("Telegram Bot Token not found on server. Telegram messages will not be sent.");
}

// New API endpoint to send Telegram messages
app.post('/api/send-telegram-message', async (req, res) => {
  if (!bot) {
    console.error("Telegram bot is not initialized on server. Cannot send message.");
    return res.status(500).json({ success: false, error: 'Telegram bot not initialized' });
  }

  const link = req.body; // Link data from the frontend

  if (!link || !link.username || !link.platform || !link.url || !link.rewards) {
      console.error("Invalid link data received:", link);
      return res.status(400).json({ success: false, error: 'Invalid link data' });
  }

  const messageText = `
📣 *New Link Shared!*

👤 *Added By:* ${link.username}
🔗 *Platform:* ${link.platform}
👥 *Group:* MemeX ARMY
🏆 *Rewards:* Link Addition ${link.rewards.add} MemeX
🏅 *Rewards:* Support ${link.rewards.support} MemeX
  `;

  const options = {
    parse_mode: 'Markdown' as const,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📝 Register & Earn', url: 'YOUR_REGISTER_URL_HERE' }, // <<< REPLACE WITH ACTUAL REGISTER URL
          { text: '✅ Visit Link', url: link.url }
        ]
      ]
    }
  };

  try {
    await bot.sendMessage(targetChatId, messageText, options);
    console.log(`New link message sent to chat ID ${targetChatId} from server`);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send Telegram message from server:', error);
    res.status(500).json({ success: false, error: 'Failed to send Telegram message' });
  }
});
// --- End Telegram Bot Logic ---


// API endpoint to read JSON files
app.get('/data/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../data', filename);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// API endpoint to write JSON files (used by Vite plugin, keeping for reference if needed)
// Note: The Vite plugin handles PUT requests to /data/ in dev mode.
// This server endpoint would be used in a production build or if not using the Vite plugin.
app.put('/data/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../data', filename);
  const data = req.body;

  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error(`Error writing to ${filename}:`, error);
    res.status(500).json({ error: 'Failed to write file' });
  }
});


// Serve the index.html for all other routes (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
