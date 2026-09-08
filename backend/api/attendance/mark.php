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
$date = trim($input['date'] ?? '');
$records = $input['records'] ?? [];

if ($date === '' || !DateTime::createFromFormat('Y-m-d', $date)) {
    sendError('A valid date (YYYY-MM-DD) is required.', 422);
}
if (!is_array($records) || count($records) === 0) {
    sendError('At least one attendance record is required.', 422);
}

$allowedStatus = ['present', 'absent', 'late', 'half_day'];

$stmt = $db->prepare(
    'INSERT INTO attendance (employee_id, date, status, check_in, check_out, notes)
     VALUES (:employee_id, :date, :status, :check_in, :check_out, :notes)
     ON DUPLICATE KEY UPDATE status = VALUES(status), check_in = VALUES(check_in),
                              check_out = VALUES(check_out), notes = VALUES(notes)'
);

$saved = 0;
foreach ($records as $record) {
    $employeeId = (int) ($record['employee_id'] ?? 0);
    $status = $record['status'] ?? 'present';
    $checkIn = trim($record['check_in'] ?? '');
    $checkOut = trim($record['check_out'] ?? '');
    $notes = trim($record['notes'] ?? '');

    if ($employeeId <= 0 || !in_array($status, $allowedStatus, true)) {
        continue; // skip invalid rows rather than failing the whole batch
    }

    $stmt->execute([
        'employee_id' => $employeeId,
        'date'        => $date,
        'status'      => $status,
        'check_in'    => $checkIn !== '' ? $checkIn : null,
        'check_out'   => $checkOut !== '' ? $checkOut : null,
        'notes'       => $notes !== '' ? $notes : null,
    ]);
    $saved++;
}

if ($saved === 0) {
    sendError('No valid attendance records were provided.', 422);
}

sendResponse(true, "Attendance saved for $saved employee(s).", ['saved' => $saved]);
