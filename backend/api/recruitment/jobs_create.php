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
$title = trim($input['title'] ?? '');
$departmentId = $input['department_id'] ?? '';
$description = trim($input['description'] ?? '');

if ($title === '') {
    sendError('Job title is required.', 422);
}

$stmt = $db->prepare(
    'INSERT INTO job_postings (title, department_id, description, status) VALUES (:title, :department_id, :description, "open")'
);
$stmt->execute([
    'title'         => $title,
    'department_id' => $departmentId !== '' ? (int) $departmentId : null,
    'description'   => $description !== '' ? $description : null,
]);

sendResponse(true, 'Job posting created successfully.', ['id' => (int) $db->lastInsertId()], 201);
