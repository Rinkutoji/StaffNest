<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$user = requireAuth($db);
requireRole($user, ['admin', 'hr']);

$input = getJsonInput();
$name = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');

if ($name === '') {
    sendError('Department name is required.', 422);
}

$check = $db->prepare('SELECT id FROM departments WHERE name = :name');
$check->execute(['name' => $name]);
if ($check->fetch()) {
    sendError('A department with this name already exists.', 409);
}

$stmt = $db->prepare('INSERT INTO departments (name, description) VALUES (:name, :description)');
$stmt->execute([
    'name'        => $name,
    'description' => $description !== '' ? $description : null,
]);

sendResponse(true, 'Department created successfully.', [
    'id' => (int) $db->lastInsertId(),
], 201);
