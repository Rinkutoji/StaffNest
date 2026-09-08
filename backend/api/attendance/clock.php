<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$authUser = requireAuth($db);

if (!$authUser['employee_id']) {
    sendError('No employee record is linked to this account. Ask an Admin/HR to link one.', 409);
}

$employeeId = $authUser['employee_id'];
$input = getJsonInput();
$action = trim($input['action'] ?? '');

if (!in_array($action, ['in', 'out'], true)) {
    sendError('Action must be "in" or "out".', 422);
}

$today = date('Y-m-d');
$now = date('H:i:s');

$existingStmt = $db->prepare('SELECT * FROM attendance WHERE employee_id = :employee_id AND date = :date');
$existingStmt->execute(['employee_id' => $employeeId, 'date' => $today]);
$existing = $existingStmt->fetch();

if ($action === 'in') {
    if ($existing && $existing['check_in']) {
        sendError('You have already clocked in today.', 409);
    }

    // After 08:30 counts as late - a simple, transparent rule for the demo.
    $status = $now > '08:30:00' ? 'late' : 'present';

    if ($existing) {
        $update = $db->prepare('UPDATE attendance SET check_in = :time, status = :status WHERE id = :id');
        $update->execute(['time' => $now, 'status' => $status, 'id' => $existing['id']]);
    } else {
        $insert = $db->prepare(
            'INSERT INTO attendance (employee_id, date, status, check_in) VALUES (:employee_id, :date, :status, :time)'
        );
        $insert->execute(['employee_id' => $employeeId, 'date' => $today, 'status' => $status, 'time' => $now]);
    }

    sendResponse(true, $status === 'late' ? 'Clocked in (marked late).' : 'Clocked in successfully.', ['time' => $now, 'status' => $status]);
}

if ($action === 'out') {
    if (!$existing || !$existing['check_in']) {
        sendError('You need to clock in before you can clock out.', 409);
    }
    if ($existing['check_out']) {
        sendError('You have already clocked out today.', 409);
    }

    $update = $db->prepare('UPDATE attendance SET check_out = :time WHERE id = :id');
    $update->execute(['time' => $now, 'id' => $existing['id']]);

    sendResponse(true, 'Clocked out successfully.', ['time' => $now]);
}
