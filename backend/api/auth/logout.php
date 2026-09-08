<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$token = getBearerToken();

if ($token) {
    $db = getDBConnection();
    $stmt = $db->prepare('DELETE FROM auth_tokens WHERE token = :token');
    $stmt->execute(['token' => $token]);
}

sendResponse(true, 'Logged out successfully.');
