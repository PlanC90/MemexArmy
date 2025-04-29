<?php

// Environment variables or fallback hardcoded values
$telegramApiKey = getenv("TELEGRAM_BOT_TOKEN") ?: '7700368269:AAHpYPBi2Dxar2ZqvgiFi9OXNBroZfVnhY'; // Corrected env var name
$supabaseUrl = getenv("SUPABASE_URL") ?: 'https://kqpoxrcqdrsyxyqgxiks.supabase.co'; // Base URL
$supabaseAnonKey = getenv("VITE_SUPABASE_ANON_KEY") ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxcG94cmNxZHJzeXh5cWd4aWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MzMwMjAsImV4cCI6MjA2MTUwOTAyMH0.rA-EQJhKarQvFd3MmicEZLzo_Kk09b5h6v_MODFStVw'; // Corrected env var name

$linksApiUrl = $supabaseUrl . '/rest/v1/links?select=*'; // API endpoint for links
$imageUrl = 'https://memex.planc.space/images/gorselb.jpg'; // Image URL for messages
$sentLinksFile = 'send.json'; // File to track sent links
$registerUrl = 'https://t.me/PlanC_Super_bot'; // Register button URL
$groupUrl = 'https://t.me/memexarmyy'; // Hardcoded target group username

// --- Function to fetch data from Supabase ---
function fetchFromSupabase($url, $apiKey) {
    $headers = [
        "apikey: $apiKey",
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json" // Added Content-Type
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); // Get HTTP status code
    curl_close($ch);

    if ($response === false) {
        error_log("❌ cURL Hatası: " . curl_error($ch)); // Log cURL errors
        return false;
    }

    if ($httpCode !== 200) {
         error_log("❌ Supabase API Hatası: HTTP Status " . $httpCode . " - Response: " . $response); // Log API errors
         return false;
    }


    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("❌ JSON Ayrıştırma Hatası: " . json_last_error_msg() . " - Data: " . $response); // Log JSON errors
        return false;
    }

    return $data;
}

// --- Function to send photo message to Telegram ---
function sendPhotoToTelegram($apiKey, $chatId, $caption, $photoUrl, $registerUrl, $visitLink) {
    $url = "https://api.telegram.org/bot$apiKey/sendPhoto";
    $postData = [
        'chat_id' => $chatId,
        'photo' => $photoUrl,
        'caption' => $caption,
        'parse_mode' => 'HTML',
        'reply_markup' => json_encode([
            'inline_keyboard' => [
                [['text' => '📝 Register & Earn', 'url' => $registerUrl]],
                [['text' => '🔗 Görev Linki', 'url' => $visitLink]] // Added Visit Link button
            ]
        ])
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true); // Specify POST request
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        error_log("❌ Telegram API Hatası: HTTP Status " . $httpCode . " - Response: " . ($response === false ? curl_error($ch) : $response));
        return false;
    }

    return true;
}

// --- Function to format the message caption ---
function formatMessage($link) {
    // Ensure timestamp is formatted nicely, assuming it's an ISO string
    $timestamp = isset($link['timestamp']) ? date('Y-m-d H:i:s', strtotime($link['timestamp'])) : 'N/A';
    $platform = isset($link['platform']) ? $link['platform'] : 'Bilinmiyor';

    return "<b>Yeni Görev!</b>\n📎 Platform: <b>{$platform}</b>\n🕒 {$timestamp}";
}

// --- Main Logic ---

// Fetch links from Supabase
$links = fetchFromSupabase($linksApiUrl, $supabaseAnonKey);

if ($links === false) {
    die("❌ Linkler çekilemedi veya ayrıştırılamadı.\n");
}

// Load previously sent links
$sentLinks = [];
if (file_exists($sentLinksFile)) {
    $sentLinksJson = file_get_contents($sentLinksFile);
    $sentLinks = json_decode($sentLinksJson, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("❌ send.json Ayrıştırma Hatası: " . json_last_error_msg());
        $sentLinks = []; // Reset if file is corrupted
    }
}
$sentLinks = is_array($sentLinks) ? $sentLinks : []; // Ensure $sentLinks is an array

$newLinksSentCount = 0;
$linksToSend = [];

// Identify new links
foreach ($links as $link) {
    // Use a unique identifier for the link, URL is a good candidate if unique
    $linkIdentifier = $link['url'];
    if (!in_array($linkIdentifier, $sentLinks)) {
        $linksToSend[] = $link;
    }
}

// Send new links to the group
$targetGroup = $groupUrl; // Use the hardcoded group username

foreach ($linksToSend as $link) {
    $messageCaption = formatMessage($link);
    $visitLink = $link['url']; // The URL from the link data

    $success = sendPhotoToTelegram($telegramApiKey, $targetGroup, $messageCaption, $imageUrl, $registerUrl, $visitLink);

    if ($success) {
        // Add the link identifier to the sent list only if sending was successful
        $sentLinks[] = $link['url']; // Use URL as identifier
        $newLinksSentCount++;
        // Optional: Add a small delay between sending messages to avoid hitting Telegram rate limits
        // usleep(100000); // 100ms delay
    } else {
        error_log("❌ Link gönderilemedi: " . $link['url']);
    }
}

// Save the updated list of sent links
if ($newLinksSentCount > 0) {
    if (file_put_contents($sentLinksFile, json_encode($sentLinks, JSON_PRETTY_PRINT)) === false) {
        error_log("❌ send.json dosyasına yazılamadı.");
    }
}

echo "✅ $newLinksSentCount yeni link gönderildi.\n";

?>
