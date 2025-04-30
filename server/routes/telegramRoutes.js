import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Environment variables
const telegramApiKey = process.env.TELEGRAM_BOT_TOKEN;
const targetGroup = process.env.TELEGRAM_TARGET_GROUP || '@memexarmyy';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Initialize clients only if keys are available
const bot = telegramApiKey ? new TelegramBot(telegramApiKey) : null;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- Function to format the message caption ---
function formatMessage(link) {
    const timestamp = link.created_at ? new Date(link.created_at).toLocaleString('tr-TR') : 'N/A';
    const platform = link.platform ? link.platform : 'Bilinmiyor';
    return `<b>Yeni Görev!</b>\n📎 Platform: <b>${platform}</b>\n🕒 ${timestamp}`;
}

// --- Function to send photo message to Telegram ---
async function sendPhotoToTelegram(chatId, caption, photoUrl, registerUrl, visitLink) {
    if (!bot) {
        console.error("Telegram bot is not initialized (API key missing).");
        throw new Error("Telegram bot not configured.");
    }
    try {
        const options = {
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📝 Register & Earn', url: registerUrl }],
                    [{ text: '🔗 Görev Linki', url: visitLink }]
                ]
            }
        };
        console.log(`Attempting to send photo to chat ID: ${chatId}`);
        await bot.sendPhoto(chatId, photoUrl, options);
        console.log(`✅ Telegram message sent to ${chatId}`);
        return true;
    } catch (error) {
        console.error('❌ Telegram mesajı gönderilirken hata oluştu:', error.message);
        // Re-throw with specific message including original error details
        throw new Error(`Failed to send Telegram message: ${error.message || error}`);
    }
}

// POST endpoint to receive new link data and send Telegram message
router.post('/send-link', async (req, res) => {
    const link = req.body;

    if (!link || !link.url || !link.platform) {
        return res.status(400).json({ success: false, message: 'Invalid link data provided.' });
    }

    if (!bot) {
         console.error("Telegram bot not configured in /send-link.");
         return res.status(500).json({ success: false, message: 'Telegram bot not configured.' });
    }

    console.log('Attempting to send Telegram message for new link:', link.url);

    const messageCaption = formatMessage(link);
    const visitLink = link.url;
    const imageUrl = 'https://memex.planc.space/images/gorselb.jpg'; // Image URL for messages
    const registerUrl = 'https://t.me/PlanC_Super_bot'; // Register button URL


    try {
        await sendPhotoToTelegram(targetGroup, messageCaption, imageUrl, registerUrl, visitLink);
        res.status(200).json({ success: true, message: 'Telegram message sent successfully.' });
    } catch (error) {
         console.error('Error in /send-link endpoint:', error.message);
         // Return the specific error message from sendPhotoToTelegram or other errors
         res.status(500).json({ success: false, message: error.message || 'An unknown error occurred while sending the link.' });
    }
});

// POST endpoint to resend the last link
router.post('/resend-last', async (req, res) => {
    console.log('Received request to resend last link.');
    console.log(`TELEGRAM_BOT_TOKEN is set: ${!!telegramApiKey}`);
    console.log(`SUPABASE_URL is set: ${!!supabaseUrl}`);
    console.log(`SUPABASE_ANON_KEY is set: ${!!supabaseAnonKey}`);
    console.log(`Telegram bot initialized: ${!!bot}`);
    console.log(`Supabase client initialized: ${!!supabase}`);


    if (!supabase) {
        console.error("Supabase client not configured in /resend-last.");
        return res.status(500).json({ success: false, message: 'Supabase client not configured. Check environment variables.' });
    }
     if (!bot) {
         console.error("Telegram bot not configured in /resend-last.");
         return res.status(500).json({ success: false, message: 'Telegram bot not configured. Check environment variables.' });
    }

    try {
        console.log('Fetching last link from Supabase...');
        const { data: links, error: fetchError } = await supabase
            .from('links')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('Error fetching last link from Supabase:', fetchError.message);
            // Return specific Supabase error
            return res.status(500).json({ success: false, message: `Failed to fetch last link from database: ${fetchError.message}` });
        }

        if (!links || links.length === 0) {
            console.log('No links found in Supabase.');
            return res.status(404).json({ success: false, message: 'No links found to resend.' });
        }

        const lastLink = links[0];
        console.log('Last link fetched:', lastLink.url);

        const messageCaption = formatMessage(lastLink);
        const visitLink = lastLink.url;
        const imageUrl = 'https://memex.planc.space/images/gorselb.jpg'; // Image URL for messages
        const registerUrl = 'https://t.me/PlanC_Super_bot'; // Register button URL

        console.log('Attempting to resend last link via Telegram...');
        // sendPhotoToTelegram will throw on failure, which is caught below
        await sendPhotoToTelegram(targetGroup, messageCaption, imageUrl, registerUrl, visitLink);

        console.log('Last link resent successfully.');
        res.status(200).json({ success: true, message: 'Last link resent successfully.' });

    } catch (error) {
        console.error('Error in /resend-last endpoint:', error.message || error);
        // Ensure a string message is returned, including error details if available
        const errorMessage = typeof error.message === 'string' && error.message.length > 0
                             ? error.message
                             : (typeof error === 'string' ? error : 'An unknown error occurred.');
        res.status(500).json({ success: false, message: `Backend error: ${errorMessage}` });
    }
});


export default router;
