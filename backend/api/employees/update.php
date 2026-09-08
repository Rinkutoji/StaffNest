<?php
/**
 * NOTE ON HTTP METHOD:
 * This endpoint intentionally accepts POST instead of PUT.
 * Native PHP does not parse multipart/form-data (file uploads) for PUT
 * requests - $_FILES stays empty. Since editing an employee can include
 * replacing the profile image, we use POST here (the employee id is sent
 * as a regular form field) instead of adding an extra library just to
 * work around this. Departments (no file upload) use real PUT/DELETE.
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';
require_once __DIR__ . '/../../helpers/employee_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$user = requireAuth($db);
requireRole($user, ['admin', 'hr']);

$id = (int) ($_POST['id'] ?? 0);
if ($id <= 0) {
    sendError('A valid employee id is required.', 422);
}

$existingStmt = $db->prepare('SELECT * FROM employees WHERE id = :id');
$existingStmt->execute(['id' => $id]);
$existing = $existingStmt->fetch();

if (!$existing) {
    sendError('Employee not found.', 404);
}

$data = validateEmployeeInput($_POST, $db, $id);

$newImage = handleProfileImageUpload();
$removeImage = ($_POST['remove_image'] ?? '') === '1';

if ($newImage) {
    deleteProfileImage($existing['profile_image']);
    $data['profile_image'] = $newImage;
} elseif ($removeImage) {
    deleteProfileImage($existing['profile_image']);
    $data['profile_image'] = null;
} else {
    $data['profile_image'] = $existing['profile_image']; // keep current image
}

$data['id'] = $id;

$stmt = $db->prepare(
    'UPDATE employees SET
        full_name = :full_name,
        email = :email,
        phone = :phone,
        gender = :gender,
        date_of_birth = :date_of_birth,
        position = :position,
        salary = :salary,
        department_id = :department_id,
        address = :address,
        profile_image = :profile_image,
        status = :status
     WHERE id = :id'
);
$stmt->execute($data);

sendResponse(true, 'Employee updated successfully.');
