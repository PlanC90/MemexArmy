<?php
$botToken = getenv('TELEGRAM_BOT_TOKEN');
$website = "https://api.telegram.org/bot".$botToken;

$update = file_get_contents('php://input');
$update = json_decode($update, TRUE);

$chatId = $update["message"]["chat"]["id"];
$message = $update["message"]["text"];

$response = "Merhaba! Sosyal medya görevlerinizi buradan yönetebilirsiniz.";

file_get_contents($website."/sendmessage?chat_id=".$chatId."&text=".urlencode($response));
?>
