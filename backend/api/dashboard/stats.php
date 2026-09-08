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
requireRole($authUser, ['admin', 'hr']);

// ================= Summary cards =================
$totalEmployees   = (int) $db->query('SELECT COUNT(*) AS c FROM employees')->fetch()['c'];
$activeEmployees  = (int) $db->query("SELECT COUNT(*) AS c FROM employees WHERE status = 'active'")->fetch()['c'];
$totalDepartments = (int) $db->query('SELECT COUNT(*) AS c FROM departments')->fetch()['c'];

$totalSalary = (float) $db->query(
    "SELECT COALESCE(SUM(salary), 0) AS s FROM employees WHERE status = 'active'"
)->fetch()['s'];

$newEmployees = (int) $db->query(
    'SELECT COUNT(*) AS c FROM employees
     WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
)->fetch()['c'];

$onLeaveToday = (int) $db->query(
    "SELECT COUNT(DISTINCT employee_id) AS c FROM leave_requests
     WHERE status = 'approved' AND CURRENT_DATE() BETWEEN start_date AND end_date"
)->fetch()['c'];

// ================= Chart A: employees per department =================
$byDepartment = $db->query(
    'SELECT d.name AS department, COUNT(e.id) AS total
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id
     GROUP BY d.id, d.name
     ORDER BY d.name ASC'
)->fetchAll();

// ================= Chart B: employee growth (last 6 months) =================
$growthRaw = $db->query(
    "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
     FROM employees
     WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')"
)->fetchAll();

$growth = [];
for ($i = 5; $i >= 0; $i--) {
    $monthKey = date('Y-m', strtotime("-$i months"));
    $monthLabel = date('M', strtotime("-$i months"));
    $found = array_values(array_filter($growthRaw, fn ($row) => $row['month'] === $monthKey));
    $growth[] = ['month' => $monthLabel, 'total' => $found ? (int) $found[0]['total'] : 0];
}

// ================= Chart C: attendance overview (most recent marked day) =================
$latestDateRow = $db->query('SELECT MAX(date) AS d FROM attendance')->fetch();
$latestDate = $latestDateRow['d'];

$attendanceCounts = ['present' => 0, 'absent' => 0, 'late' => 0, 'half_day' => 0];
if ($latestDate) {
    $attStmt = $db->prepare('SELECT status, COUNT(*) AS total FROM attendance WHERE date = :d GROUP BY status');
    $attStmt->execute(['d' => $latestDate]);
    foreach ($attStmt->fetchAll() as $row) {
        $attendanceCounts[$row['status']] = (int) $row['total'];
    }
}

// ================= Chart D: leave requests per month (last 6 months) =================
$leaveRaw = $db->query(
    "SELECT DATE_FORMAT(start_date, '%Y-%m') AS month, COUNT(*) AS total
     FROM leave_requests
     WHERE start_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
     GROUP BY DATE_FORMAT(start_date, '%Y-%m')"
)->fetchAll();

$leaveByMonth = [];
for ($i = 5; $i >= 0; $i--) {
    $monthKey = date('Y-m', strtotime("-$i months"));
    $monthLabel = date('M', strtotime("-$i months"));
    $found = array_values(array_filter($leaveRaw, fn ($row) => $row['month'] === $monthKey));
    $leaveByMonth[] = ['month' => $monthLabel, 'total' => $found ? (int) $found[0]['total'] : 0];
}

// ================= Recent activity (employees added/updated) =================
$recent = $db->query(
    "SELECT full_name, position, created_at, updated_at,
            (updated_at > created_at) AS was_updated
     FROM employees
     ORDER BY GREATEST(created_at, updated_at) DESC
     LIMIT 5"
)->fetchAll();

// ================= Upcoming birthdays (next 30 days) =================
$birthdays = $db->query(
    "SELECT full_name, profile_image, date_of_birth,
            DATE_ADD(date_of_birth, INTERVAL (YEAR(CURDATE()) - YEAR(date_of_birth)
                + IF(DAYOFYEAR(CURDATE()) > DAYOFYEAR(date_of_birth), 1, 0)) YEAR) AS next_birthday
     FROM employees
     WHERE date_of_birth IS NOT NULL AND status = 'active'
     HAVING next_birthday BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
     ORDER BY next_birthday ASC
     LIMIT 5"
)->fetchAll();

// ================= Who's on leave right now =================
$onLeaveList = $db->query(
    "SELECT e.full_name, e.profile_image, l.leave_type, l.start_date, l.end_date
     FROM leave_requests l
     INNER JOIN employees e ON e.id = l.employee_id
     WHERE l.status = 'approved' AND CURRENT_DATE() BETWEEN l.start_date AND l.end_date
     ORDER BY l.end_date ASC
     LIMIT 5"
)->fetchAll();

// ================= Upcoming approved leaves (next 14 days) =================
$upcomingLeaves = $db->query(
    "SELECT e.full_name, e.profile_image, l.leave_type, l.start_date, l.end_date
     FROM leave_requests l
     INNER JOIN employees e ON e.id = l.employee_id
     WHERE l.status = 'approved' AND l.start_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
     ORDER BY l.start_date ASC
     LIMIT 5"
)->fetchAll();

// ================= Pending approvals count (for notification badge) =================
$pendingLeaves = (int) $db->query("SELECT COUNT(*) AS c FROM leave_requests WHERE status = 'pending'")->fetch()['c'];

// ================= Unified notifications feed (bell + panel) =================
$notifications = [];

foreach ($recent as $item) {
    $notifications[] = [
        'type'      => $item['was_updated'] ? 'employee_updated' : 'employee_added',
        'message'   => $item['was_updated']
            ? "Employee record updated: {$item['full_name']}"
            : "New employee added: {$item['full_name']}",
        'timestamp' => $item['was_updated'] ? $item['updated_at'] : $item['created_at'],
        'status'    => $item['was_updated'] ? 'info' : 'success',
    ];
}

$pendingLeaveRows = $db->query(
    "SELECT e.full_name, l.created_at FROM leave_requests l
     INNER JOIN employees e ON e.id = l.employee_id
     WHERE l.status = 'pending' ORDER BY l.created_at DESC LIMIT 5"
)->fetchAll();
foreach ($pendingLeaveRows as $row) {
    $notifications[] = [
        'type'      => 'leave_submitted',
        'message'   => "Leave request submitted: {$row['full_name']}",
        'timestamp' => $row['created_at'],
        'status'    => 'warning',
    ];
}

$recentDepartments = $db->query(
    "SELECT name, created_at FROM departments
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY created_at DESC LIMIT 3"
)->fetchAll();
foreach ($recentDepartments as $row) {
    $notifications[] = [
        'type'      => 'department_created',
        'message'   => "Department created: {$row['name']}",
        'timestamp' => $row['created_at'],
        'status'    => 'success',
    ];
}

$recentPayroll = $db->query(
    "SELECT month, COUNT(*) AS total, MAX(created_at) AS created_at FROM payroll
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY month ORDER BY created_at DESC LIMIT 2"
)->fetchAll();
foreach ($recentPayroll as $row) {
    $notifications[] = [
        'type'      => 'payroll_generated',
        'message'   => "Payroll generated for {$row['month']} ({$row['total']} employees)",
        'timestamp' => $row['created_at'],
        'status'    => 'info',
    ];
}

usort($notifications, fn ($a, $b) => strtotime($b['timestamp']) <=> strtotime($a['timestamp']));
$notifications = array_slice($notifications, 0, 8);

sendResponse(true, 'Dashboard stats fetched successfully.', [
    'cards' => [
        'total_employees'   => $totalEmployees,
        'active_employees'  => $activeEmployees,
        'total_departments' => $totalDepartments,
        'new_employees'     => $newEmployees,
        'total_salary'      => $totalSalary,
        'on_leave_today'    => $onLeaveToday,
    ],
    'charts' => [
        'employees_by_department' => $byDepartment,
        'employee_growth'         => $growth,
        'attendance_overview'      => [
            'date'   => $latestDate,
            'counts' => $attendanceCounts,
        ],
        'leave_requests_by_month' => $leaveByMonth,
    ],
    'recent_activity'   => $recent,
    'upcoming_birthdays' => $birthdays,
    'on_leave_now'       => $onLeaveList,
    'upcoming_leaves'    => $upcomingLeaves,
    'pending_leaves'     => $pendingLeaves,
    'notifications'      => $notifications,
]);
