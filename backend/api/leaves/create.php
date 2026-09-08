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

$input = getJsonInput();
$employeeId = (int) ($input['employee_id'] ?? 0);
$leaveType  = trim($input['leave_type'] ?? 'annual');
$startDate  = trim($input['start_date'] ?? '');
$endDate    = trim($input['end_date'] ?? '');
$reason     = trim($input['reason'] ?? '');

// An Employee-role account can only ever submit leave for themselves -
// ignore any employee_id they send and use their linked HR record instead.
if ($authUser['role'] === 'employee') {
    if (!$authUser['employee_id']) {
        sendError('No employee record is linked to this account. Ask an Admin/HR to link one.', 409);
    }
    $employeeId = $authUser['employee_id'];
}

if ($employeeId <= 0) {
    sendError('Please select an employee.', 422);
}
if (!in_array($leaveType, ['annual', 'sick', 'unpaid', 'other'], true)) {
    sendError('Invalid leave type.', 422);
}
if (!DateTime::createFromFormat('Y-m-d', $startDate) || !DateTime::createFromFormat('Y-m-d', $endDate)) {
    sendError('Start date and end date must be valid (YYYY-MM-DD).', 422);
}
if ($endDate < $startDate) {
    sendError('End date cannot be before the start date.', 422);
}

$check = $db->prepare('SELECT id FROM employees WHERE id = :id');
$check->execute(['id' => $employeeId]);
if (!$check->fetch()) {
    sendError('Employee not found.', 404);
}

$stmt = $db->prepare(
    'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
     VALUES (:employee_id, :leave_type, :start_date, :end_date, :reason, "pending")'
);
$stmt->execute([
    'employee_id' => $employeeId,
    'leave_type'  => $leaveType,
    'start_date'  => $startDate,
    'end_date'    => $endDate,
    'reason'      => $reason !== '' ? $reason : null,
]);

sendResponse(true, 'Leave request submitted successfully.', [
    'id' => (int) $db->lastInsertId(),
], 201);
