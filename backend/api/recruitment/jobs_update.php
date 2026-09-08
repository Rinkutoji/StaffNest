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
$title = trim($input['title'] ?? '');
$departmentId = $input['department_id'] ?? '';
$description = trim($input['description'] ?? '');
$status = trim($input['status'] ?? 'open');

if ($id <= 0) {
    sendError('A valid job posting id is required.', 422);
}
if ($title === '') {
    sendError('Job title is required.', 422);
}
if (!in_array($status, ['open', 'closed'], true)) {
    sendError('Status must be open or closed.', 422);
}

$existing = $db->prepare('SELECT id FROM job_postings WHERE id = :id');
$existing->execute(['id' => $id]);
if (!$existing->fetch()) {
    sendError('Job posting not found.', 404);
}

$stmt = $db->prepare(
    'UPDATE job_postings SET title = :title, department_id = :department_id, description = :description, status = :status WHERE id = :id'
);
$stmt->execute([
    'title'         => $title,
    'department_id' => $departmentId !== '' ? (int) $departmentId : null,
    'description'   => $description !== '' ? $description : null,
    'status'        => $status,
    'id'            => $id,
]);

sendResponse(true, 'Job posting updated successfully.');
