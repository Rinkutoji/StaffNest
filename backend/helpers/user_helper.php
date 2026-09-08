<?php
/**
 * Handles profile photo uploads for login accounts (users table).
 * Mirrors helpers/employee_helper.php but stores files in
 * uploads/avatars/ to keep user avatars separate from employee HR photos.
 */

require_once __DIR__ . '/response.php';

function handleAvatarUpload(): ?string
{
    if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $file = $_FILES['profile_image'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        sendError('Image upload failed. Please try again.', 422);
    }

    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, $allowedTypes, true)) {
        sendError('Profile image must be a JPG, PNG or WEBP file.', 422);
    }

    $maxSizeBytes = 2 * 1024 * 1024; // 2MB
    if ($file['size'] > $maxSizeBytes) {
        sendError('Profile image must be smaller than 2MB.', 422);
    }

    $extensionMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $extension = $extensionMap[$mimeType];
    $filename = uniqid('avatar_', true) . '.' . $extension;
    $destination = __DIR__ . '/../uploads/avatars/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        sendError('Could not save the uploaded image.', 500);
    }

    return $filename;
}

function deleteAvatar(?string $filename): void
{
    if (!$filename) {
        return;
    }
    $path = __DIR__ . '/../uploads/avatars/' . $filename;
    if (is_file($path)) {
        @unlink($path);
    }
}
