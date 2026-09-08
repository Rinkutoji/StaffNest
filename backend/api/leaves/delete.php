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
    sendError('A valid leave request id is required.', 422);
}

$stmt = $db->prepare('DELETE FROM leave_requests WHERE id = :id');
$stmt->execute(['id' => $id]);

if ($stmt->rowCount() === 0) {
    sendError('Leave request not found.', 404);
}

sendResponse(true, 'Leave request deleted.');
