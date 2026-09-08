<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$user = requireAuth($db);
requireRole($user, ['admin']);

$input = getJsonInput();
$id = (int) ($input['id'] ?? $_GET['id'] ?? 0);

if ($id <= 0) {
    sendError('A valid department id is required.', 422);
}

$existing = $db->prepare('SELECT id FROM departments WHERE id = :id');
$existing->execute(['id' => $id]);
if (!$existing->fetch()) {
    sendError('Department not found.', 404);
}

// Employees in this department are kept, their department_id becomes NULL
// (see the ON DELETE SET NULL foreign key in the schema).
$stmt = $db->prepare('DELETE FROM departments WHERE id = :id');
$stmt->execute(['id' => $id]);

sendResponse(true, 'Department deleted successfully.');
