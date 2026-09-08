<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$authUser = requireAuth($db);

if (!$authUser['employee_id']) {
    sendResponse(true, 'No employee record is linked to this account yet.', ['linked' => false]);
}

$employeeId = $authUser['employee_id'];

// ---- Personal HR record snapshot ----
$empStmt = $db->prepare(
    'SELECT e.full_name, e.position, e.salary, e.status, e.created_at, e.profile_image,
            d.name AS department_name
     FROM employees e LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.id = :id'
);
$empStmt->execute(['id' => $employeeId]);
$employee = $empStmt->fetch();

// ---- Today's attendance status ----
$today = date('Y-m-d');
$todayStmt = $db->prepare('SELECT status, check_in, check_out FROM attendance WHERE employee_id = :id AND date = :date');
$todayStmt->execute(['id' => $employeeId, 'date' => $today]);
$todayAttendance = $todayStmt->fetch() ?: null;

// ---- This month's attendance summary ----
$monthStmt = $db->prepare(
    "SELECT status, COUNT(*) AS total FROM attendance
     WHERE employee_id = :id AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
     GROUP BY status"
);
$monthStmt->execute(['id' => $employeeId]);
$monthCounts = ['present' => 0, 'absent' => 0, 'late' => 0, 'half_day' => 0];
foreach ($monthStmt->fetchAll() as $row) {
    $monthCounts[$row['status']] = (int) $row['total'];
}

// ---- Leave summary ----
$leaveCountsStmt = $db->prepare(
    "SELECT status, COUNT(*) AS total FROM leave_requests WHERE employee_id = :id GROUP BY status"
);
$leaveCountsStmt->execute(['id' => $employeeId]);
$leaveCounts = ['pending' => 0, 'approved' => 0, 'rejected' => 0];
foreach ($leaveCountsStmt->fetchAll() as $row) {
    $leaveCounts[$row['status']] = (int) $row['total'];
}

$recentLeavesStmt = $db->prepare(
    'SELECT leave_type, start_date, end_date, status, created_at, reviewed_at
     FROM leave_requests WHERE employee_id = :id ORDER BY created_at DESC LIMIT 5'
);
$recentLeavesStmt->execute(['id' => $employeeId]);
$recentLeaves = $recentLeavesStmt->fetchAll();

$upcomingLeaveStmt = $db->prepare(
    "SELECT leave_type, start_date, end_date FROM leave_requests
     WHERE employee_id = :id AND status = 'approved' AND start_date >= CURDATE()
     ORDER BY start_date ASC LIMIT 1"
);
$upcomingLeaveStmt->execute(['id' => $employeeId]);
$upcomingLeave = $upcomingLeaveStmt->fetch() ?: null;

// ---- Latest payslip ----
$latestPayStmt = $db->prepare(
    'SELECT month, base_salary, bonus, deductions, net_salary, status, paid_at
     FROM payroll WHERE employee_id = :id ORDER BY month DESC LIMIT 1'
);
$latestPayStmt->execute(['id' => $employeeId]);
$latestPayslip = $latestPayStmt->fetch() ?: null;

sendResponse(true, 'Personal dashboard stats fetched successfully.', [
    'linked'           => true,
    'employee'         => $employee,
    'today_attendance' => $todayAttendance,
    'month_attendance' => $monthCounts,
    'leave_summary'    => $leaveCounts,
    'recent_leaves'    => $recentLeaves,
    'upcoming_leave'   => $upcomingLeave,
    'latest_payslip'   => $latestPayslip,
]);
