<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';
require_once __DIR__ . '/../../helpers/user_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$authUser = requireAuth($db);

// Note: uses multipart/form-data (like employees/update.php) because of
// the profile image upload, so fields come from $_POST, not JSON.
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$currentPassword = (string) ($_POST['current_password'] ?? '');
$newPassword = (string) ($_POST['new_password'] ?? '');
$removeImage = ($_POST['remove_image'] ?? '') === '1';

if ($name === '') {
    sendError('Name is required.', 422);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('A valid email address is required.', 422);
}

// Email must stay unique across accounts (excluding the current user)
$check = $db->prepare('SELECT id FROM users WHERE email = :email AND id != :id');
$check->execute(['email' => $email, 'id' => $authUser['id']]);
if ($check->fetch()) {
    sendError('Another account already uses this email.', 409);
}

// Fetch the real password hash + current image (never returned by requireAuth)
$stmt = $db->prepare('SELECT password, profile_image FROM users WHERE id = :id');
$stmt->execute(['id' => $authUser['id']]);
$row = $stmt->fetch();

$updates = [
    'name'  => $name,
    'email' => $email,
    'phone' => $phone !== '' ? $phone : null,
    'id'    => $authUser['id'],
];

$setClauses = ['name = :name', 'email = :email', 'phone = :phone'];

// ---- Optional password change ----
if ($newPassword !== '') {
    if ($currentPassword === '' || !password_verify($currentPassword, $row['password'])) {
        sendError('Current password is incorrect.', 401);
    }
    if (strlen($newPassword) < 6) {
        sendError('New password must be at least 6 characters long.', 422);
    }
    $updates['password'] = password_hash($newPassword, PASSWORD_BCRYPT);
    $setClauses[] = 'password = :password';
}

// ---- Optional profile image change ----
$newImage = handleAvatarUpload();
if ($newImage) {
    deleteAvatar($row['profile_image']);
    $updates['profile_image'] = $newImage;
    $setClauses[] = 'profile_image = :profile_image';
} elseif ($removeImage) {
    deleteAvatar($row['profile_image']);
    $updates['profile_image'] = null;
    $setClauses[] = 'profile_image = :profile_image';
}

$sql = 'UPDATE users SET ' . implode(', ', $setClauses) . ' WHERE id = :id';
$update = $db->prepare($sql);
$update->execute($updates);

// Return the fresh user record (mirrors requireAuth's shape)
$fresh = $db->prepare('SELECT id, name, email, phone, profile_image, role, employee_id FROM users WHERE id = :id');
$fresh->execute(['id' => $authUser['id']]);

sendResponse(true, 'Profile updated successfully.', ['user' => $fresh->fetch()]);
