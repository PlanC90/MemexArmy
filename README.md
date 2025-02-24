# MemeX Bot Management Dashboard

A modern web application for managing social media tasks and rewards through a Telegram bot.

## Features

- 📊 Real-time dashboard with analytics
- 👥 User profile management with Telegram integration
- 🔗 Social media link tracking
- 💰 Reward system
- ⚙️ Admin controls
- 📥 Data export capabilities

## Running on Replit

1. Create a new Repl and select "Node.js" as the template
2. Import this GitHub repository into your Repl
3. Set up your environment variables:
   - Click on "Secrets" in the Tools panel
   - Add a new secret with key `TELEGRAM_BOT_TOKEN` and your bot token as the value
4. Click on "Run" to start the server

The application will automatically:
- Install dependencies
- Start the Express server with Telegram bot integration
- Serve the React frontend

## Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start the server (includes both backend and frontend)
npm run dev

# Build for production
npm run build
```

## Project Structure

```
├── data/               # JSON data storage
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   └── types/         # TypeScript types
└── server.js          # Express server with Telegram bot
```

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Express.js
- Node Telegram Bot API
- Vite

## Environment Variables

Required environment variables:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## Features

### Telegram Integration
- Automatic username retrieval from Telegram
- Welcome message with photo
- Interactive bot commands
- Real-time user tracking

### User Management
- Automatic user profile creation
- Balance tracking
- Task management
- Withdrawal system

### Admin Features
- User management
- Task monitoring
- System settings
- Analytics dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
