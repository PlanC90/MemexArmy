<?php
header('Content-Type: application/json');

$response = [
    'status' => 'success',
    'message' => 'Kullanıcı profili bilgileri',
    'data' => [
        'username' => 'kullanici_adi',
        'email' => 'kullanici@example.com'
    ]
];

echo json_encode($response);
?>
