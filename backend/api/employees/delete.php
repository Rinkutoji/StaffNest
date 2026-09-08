<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';
require_once __DIR__ . '/../../helpers/employee_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$user = requireAuth($db);
requireRole($user, ['admin']);

$input = getJsonInput();
$id = (int) ($input['id'] ?? $_GET['id'] ?? 0);

if ($id <= 0) {
    sendError('A valid employee id is required.', 422);
}

$stmt = $db->prepare('SELECT profile_image FROM employees WHERE id = :id');
$stmt->execute(['id' => $id]);
$employee = $stmt->fetch();

if (!$employee) {
    sendError('Employee not found.', 404);
}

$delete = $db->prepare('DELETE FROM employees WHERE id = :id');
$delete->execute(['id' => $id]);

deleteProfileImage($employee['profile_image']);

sendResponse(true, 'Employee deleted successfully.');
