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

if ($id <= 0) {
    sendError('A valid payroll id is required.', 422);
}

$existing = $db->prepare('SELECT status FROM payroll WHERE id = :id');
$existing->execute(['id' => $id]);
$record = $existing->fetch();

if (!$record) {
    sendError('Payroll record not found.', 404);
}
if ($record['status'] === 'paid') {
    sendError('This payroll record is already marked as paid.', 409);
}

$stmt = $db->prepare("UPDATE payroll SET status = 'paid', paid_at = NOW() WHERE id = :id");
$stmt->execute(['id' => $id]);

sendResponse(true, 'Payroll record marked as paid.');
