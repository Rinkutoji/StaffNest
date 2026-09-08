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
$month = trim($input['month'] ?? date('Y-m'));

if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    sendError('Month must be in YYYY-MM format.', 422);
}

$employees = $db->query("SELECT id, salary FROM employees WHERE status = 'active'")->fetchAll();

$insert = $db->prepare(
    'INSERT IGNORE INTO payroll (employee_id, month, base_salary, bonus, deductions, net_salary, status)
     VALUES (:employee_id, :month, :base_salary, 0, 0, :net_salary, "pending")'
);

$generated = 0;
foreach ($employees as $emp) {
    $insert->execute([
        'employee_id' => $emp['id'],
        'month'       => $month,
        'base_salary' => $emp['salary'],
        'net_salary'  => $emp['salary'],
    ]);
    if ($insert->rowCount() > 0) {
        $generated++;
    }
}

$skipped = count($employees) - $generated;

sendResponse(true, "Payroll generated for $generated employee(s) for $month." . ($skipped > 0 ? " ($skipped already existed.)" : ''), [
    'generated' => $generated,
    'skipped'   => $skipped,
    'month'     => $month,
]);
