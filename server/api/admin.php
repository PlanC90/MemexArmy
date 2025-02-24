<?php
header('Content-Type: application/json');

$response = [
    'status' => 'success',
    'message' => 'Yönetici paneli bilgileri',
    'data' => [
        'total_users' => 100,
        'active_tasks' => 10
    ]
];

echo json_encode($response);
?>
