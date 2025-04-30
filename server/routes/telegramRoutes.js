import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client

const router = express.Router();

// Environment variables (ensure these are set in your Render environment)
const telegramApiKey = process.env.TELEGRAM_BOT_TOKEN;
const targetGroup = process.env.TELEGRAM_TARGET_GROUP || '@memexarmyy'; // Default group

// Supabase Client (ensure these are set in your Render environment)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!telegramApiKey) {
    console.error("TELEGRAM_BOT_TOKEN is not set. Telegram messages will not be sent.");
}
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("SUPABASE_URL or SUPABASE_ANON_KEY is not set. Cannot fetch data.");
}

const bot = telegramApiKey ? new TelegramBot(telegramApiKey) : null;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;


const imageUrl = 'https://memex.planc.space/images/gorselb.jpg'; // Image URL for messages
const registerUrl = 'https://t.me/PlanC_Super_bot'; // Register button URL

// --- Function to format the message caption ---
function formatMessage(link) {
    // Ensure timestamp is formatted nicely, assuming it's an ISO string
    const timestamp = link.created_at ? new Date(link.created_at).toLocaleString('tr-TR') : 'N/A'; // Use created_at
    const platform = link.platform ? link.platform : 'Bilinmiyor';

    return `<b>Yeni Görev!</b>\n📎 Platform: <b>${platform}</b>\n🕒 ${timestamp}`;
}

// --- Function to send photo message to Telegram ---
async function sendPhotoToTelegram(chatId, caption, photoUrl, registerUrl, visitLink) {
    if (!bot) {
        console.error("Telegram bot is not initialized (API key missing).");
        return false;
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
        await bot.sendPhoto(chatId, photoUrl, options);
        console.log(`✅ Telegram message sent to ${chatId}`);
        return true;
    } catch (error) {
        console.error('❌ Telegram mesajı gönderilirken hata oluştu:', error.message);
        return false;
    }
}

// POST endpoint to receive new link data and send Telegram message
router.post('/send-link', async (req, res) => {
    const link = req.body; // Expecting the new link object in the request body

    if (!link || !link.url || !link.platform) {
        return res.status(400).json({ success: false, message: 'Invalid link data provided.' });
    }

    if (!bot) {
         return res.status(500).json({ success: false, message: 'Telegram bot not configured.' });
    }

    console.log('Attempting to send Telegram message for new link:', link.url);

    const messageCaption = formatMessage(link);
    const visitLink = link.url;

    const success = await sendPhotoToTelegram(targetGroup, messageCaption, imageUrl, registerUrl, visitLink);

    if (success) {
        res.status(200).json({ success: true, message: 'Telegram message sent successfully.' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to send Telegram message.' });
    }
});

// POST endpoint to resend the last link
router.post('/resend-last', async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ success: false, message: 'Supabase client not configured.' });
    }
     if (!bot) {
         return res.status(500).json({ success: false, message: 'Telegram bot not configured.' });
    }

    try {
        // Fetch the last link ordered by created_at descending
        const { data: links, error } = await supabase
            .from('links')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error fetching last link from Supabase:', error.message);
            return res.status(500).json({ success: false, message: 'Failed to fetch last link.' });
        }

        if (!links || links.length === 0) {
            return res.status(404).json({ success: false, message: 'No links found to resend.' });
        }

        const lastLink = links[0];
        console.log('Attempting to resend last link:', lastLink.url);

        const messageCaption = formatMessage(lastLink);
        const visitLink = lastLink.url;

        const success = await sendPhotoToTelegram(targetGroup, messageCaption, imageUrl, registerUrl, visitLink);

        if (success) {
            res.status(200).json({ success: true, message: 'Last link resent successfully.' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to resend last link.' });
        }

    } catch (error) {
        console.error('Error in /resend-last endpoint:', error.message);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});


export default router;
