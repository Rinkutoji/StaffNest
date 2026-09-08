<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = (string) ($input['password'] ?? '');

if ($email === '' || $password === '') {
    sendError('Email and password are required.', 422);
}

$db = getDBConnection();

$stmt = $db->prepare('SELECT id, name, email, phone, profile_image, password, role, employee_id FROM users WHERE email = :email LIMIT 1');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    sendError('Invalid email or password.', 401);
}

// Create a fresh token valid for 7 days
$token = generateToken();
$expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

$insert = $db->prepare(
    'INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)'
);
$insert->execute([
    'user_id'    => $user['id'],
    'token'      => $token,
    'expires_at' => $expiresAt,
]);

unset($user['password']); // never send the hash back to the client

sendResponse(true, 'Login successful.', [
    'token' => $token,
    'user'  => $user,
]);
