import { createClient } from '@supabase/supabase-js';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment variables
const telegramApiKey = process.env.TELEGRAM_BOT_TOKEN || '7700368269:AAHpYPBi2Dxar2ZqvgiFi9OXNBroZfVnhY';
const supabaseUrl = process.env.SUPABASE_URL || 'https://kqpoxrcqdrsyxyqgxiks.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxcG94cmNxZHJzeXh5cWd4aWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MzMwMjAsImV4cCI6MjA2MTUwOTAyMH0.rA-EQJhKarQvFd3MmicEZLzo_Kk09b5h6v_MODFStVw';

const bot = new TelegramBot(telegramApiKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const imageUrl = 'https://memex.planc.space/images/gorselb.jpg'; // Image URL for messages
const registerUrl = 'https://t.me/PlanC_Super_bot'; // Register button URL
const targetGroup = '@memexarmyy'; // Hardcoded target group username

// --- Function to fetch the latest link from Supabase ---
async function fetchLatestLink() {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false }) // Assuming 'created_at' is the timestamp column
      .limit(1);

    if (error) {
      console.error('❌ Supabase Hatası:', error.message);
      return null;
    }
    // Return the single latest link object, or null if none found
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ En son linki çekerken hata oluştu:', error);
    return null;
  }
}

// --- Function to format the message caption ---
function formatMessage(link) {
    // Ensure timestamp is formatted nicely, assuming it's an ISO string
    const timestamp = link.created_at ? new Date(link.created_at).toLocaleString('tr-TR') : 'N/A'; // Use created_at
    const platform = link.platform ? link.platform : 'Bilinmiyor';

    return `<b>Yeni Görev!</b>\n📎 Platform: <b>${platform}</b>\n🕒 ${timestamp}`;
}

// --- Function to send photo message to Telegram ---
async function sendPhotoToTelegram(chatId, caption, photoUrl, registerUrl, visitLink) {
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
        return true;
    } catch (error) {
        console.error('❌ Telegram mesajı gönderilirken hata oluştu:', error.message);
        return false;
    }
}

// --- Main Logic ---
async function main() {
  console.log('✅ En son link kontrol ediliyor...');

  const latestLink = await fetchLatestLink();

  if (!latestLink) {
    console.log('✅ Henüz link bulunamadı veya çekilemedi.');
    return;
  }

  console.log('✅ En son link bulundu. Gönderiliyor...');

  const messageCaption = formatMessage(latestLink);
  const visitLink = latestLink.url;

  const success = await sendPhotoToTelegram(targetGroup, messageCaption, imageUrl, registerUrl, visitLink);

  if (success) {
    console.log('✅ En son link başarıyla gönderildi.');
  } else {
    console.error('❌ En son link gönderilemedi:', latestLink.url);
  }
}

main();
