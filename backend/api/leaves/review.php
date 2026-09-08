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
$id = (int) ($input['id'] ?? 0);
$status = trim($input['status'] ?? '');

if ($id <= 0) {
    sendError('A valid leave request id is required.', 422);
}
if (!in_array($status, ['approved', 'rejected'], true)) {
    sendError('Status must be approved or rejected.', 422);
}

$existing = $db->prepare('SELECT id FROM leave_requests WHERE id = :id');
$existing->execute(['id' => $id]);
if (!$existing->fetch()) {
    sendError('Leave request not found.', 404);
}

$stmt = $db->prepare(
    'UPDATE leave_requests
     SET status = :status, reviewed_by = :reviewed_by, reviewed_at = NOW()
     WHERE id = :id'
);
$stmt->execute([
    'status'      => $status,
    'reviewed_by' => $user['id'],
    'id'          => $id,
]);

sendResponse(true, "Leave request $status.");
