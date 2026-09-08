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
$stage = trim($input['stage'] ?? '');

$allowedStages = ['applied', 'interview', 'offered', 'hired', 'rejected'];

if ($id <= 0) {
    sendError('A valid candidate id is required.', 422);
}
if (!in_array($stage, $allowedStages, true)) {
    sendError('Invalid pipeline stage.', 422);
}

$existing = $db->prepare('SELECT id FROM candidates WHERE id = :id');
$existing->execute(['id' => $id]);
if (!$existing->fetch()) {
    sendError('Candidate not found.', 404);
}

$stmt = $db->prepare('UPDATE candidates SET stage = :stage WHERE id = :id');
$stmt->execute(['stage' => $stage, 'id' => $id]);

sendResponse(true, 'Candidate stage updated.');
