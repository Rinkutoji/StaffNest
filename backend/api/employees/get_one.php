<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
requireAuth($db);

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    sendError('A valid employee id is required.', 422);
}

$stmt = $db->prepare(
    'SELECT e.*, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.id = :id'
);
$stmt->execute(['id' => $id]);
$employee = $stmt->fetch();

if (!$employee) {
    sendError('Employee not found.', 404);
}

sendResponse(true, 'Employee fetched successfully.', ['employee' => $employee]);
