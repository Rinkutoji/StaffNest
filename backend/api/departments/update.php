<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$user = requireAuth($db);
requireRole($user, ['admin', 'hr']);

$input = getJsonInput();
$id = (int) ($input['id'] ?? 0);
$name = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');

if ($id <= 0) {
    sendError('A valid department id is required.', 422);
}
if ($name === '') {
    sendError('Department name is required.', 422);
}

$existing = $db->prepare('SELECT id FROM departments WHERE id = :id');
$existing->execute(['id' => $id]);
if (!$existing->fetch()) {
    sendError('Department not found.', 404);
}

$check = $db->prepare('SELECT id FROM departments WHERE name = :name AND id != :id');
$check->execute(['name' => $name, 'id' => $id]);
if ($check->fetch()) {
    sendError('Another department already uses this name.', 409);
}

$stmt = $db->prepare('UPDATE departments SET name = :name, description = :description WHERE id = :id');
$stmt->execute([
    'name'        => $name,
    'description' => $description !== '' ? $description : null,
    'id'          => $id,
]);

sendResponse(true, 'Department updated successfully.');
