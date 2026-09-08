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
$bonus = $input['bonus'] ?? 0;
$deductions = $input['deductions'] ?? 0;

if ($id <= 0) {
    sendError('A valid payroll id is required.', 422);
}
if (!is_numeric($bonus) || (float) $bonus < 0) {
    sendError('Bonus must be a valid positive number.', 422);
}
if (!is_numeric($deductions) || (float) $deductions < 0) {
    sendError('Deductions must be a valid positive number.', 422);
}

$existing = $db->prepare('SELECT base_salary, status FROM payroll WHERE id = :id');
$existing->execute(['id' => $id]);
$record = $existing->fetch();

if (!$record) {
    sendError('Payroll record not found.', 404);
}
if ($record['status'] === 'paid') {
    sendError('This payroll record has already been paid and can no longer be edited.', 409);
}

$net = round((float) $record['base_salary'] + (float) $bonus - (float) $deductions, 2);

$stmt = $db->prepare('UPDATE payroll SET bonus = :bonus, deductions = :deductions, net_salary = :net WHERE id = :id');
$stmt->execute([
    'bonus'      => $bonus,
    'deductions' => $deductions,
    'net'        => $net,
    'id'         => $id,
]);

sendResponse(true, 'Payroll record updated.', ['net_salary' => $net]);
