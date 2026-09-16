<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'online',
    'message' => 'StaffNest API backend is running successfully.'
]);
