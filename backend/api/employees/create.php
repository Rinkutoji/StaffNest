<?php
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
requireRole($user, ['admin', 'hr']); // only admin/hr may create employees

// Note: employee create/update use multipart/form-data (because of the
// profile image upload), so fields are read from $_POST, not JSON.
$data = validateEmployeeInput($_POST, $db);
$data['profile_image'] = handleProfileImageUpload();

$stmt = $db->prepare(
    'INSERT INTO employees
        (full_name, email, phone, gender, date_of_birth, position, salary, department_id, address, profile_image, status)
     VALUES
        (:full_name, :email, :phone, :gender, :date_of_birth, :position, :salary, :department_id, :address, :profile_image, :status)'
);
$stmt->execute($data);

sendResponse(true, 'Employee created successfully.', [
    'id' => (int) $db->lastInsertId(),
], 201);
