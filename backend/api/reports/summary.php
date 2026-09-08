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

// ---- Headcount trend (last 6 months) ------------------------------
$headcountRaw = $db->query(
    "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
     FROM employees
     WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')"
)->fetchAll();

$headcount = [];
$runningTotal = (int) $db->query(
    "SELECT COUNT(*) AS c FROM employees WHERE created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)"
)->fetch()['c'];

for ($i = 5; $i >= 0; $i--) {
    $monthKey = date('Y-m', strtotime("-$i months"));
    $monthLabel = date('M', strtotime("-$i months"));
    $found = array_values(array_filter($headcountRaw, fn ($row) => $row['month'] === $monthKey));
    $monthNew = $found ? (int) $found[0]['total'] : 0;
    $runningTotal += $monthNew;
    $headcount[] = ['month' => $monthLabel, 'new_hires' => $monthNew, 'total_headcount' => $runningTotal];
}

// ---- Department distribution --------------------------------------
$byDepartment = $db->query(
    "SELECT d.name AS department, COUNT(e.id) AS total
     FROM departments d LEFT JOIN employees e ON e.department_id = d.id
     GROUP BY d.id, d.name ORDER BY d.name"
)->fetchAll();

// ---- Payroll totals (last 6 months, paid only) ----------------------
$payrollRaw = $db->query(
    "SELECT month, COALESCE(SUM(net_salary),0) AS total
     FROM payroll WHERE status = 'paid'
     GROUP BY month ORDER BY month"
)->fetchAll();
$payrollByMonth = [];
foreach ($payrollRaw as $row) {
    $label = date('M Y', strtotime($row['month'] . '-01'));
    $payrollByMonth[] = ['month' => $label, 'total' => (float) $row['total']];
}

// ---- Attendance rate (last 30 days) ----------------------------------
$attendanceRaw = $db->query(
    "SELECT status, COUNT(*) AS total FROM attendance
     WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
     GROUP BY status"
)->fetchAll();
$attendanceCounts = ['present' => 0, 'absent' => 0, 'late' => 0, 'half_day' => 0];
foreach ($attendanceRaw as $row) {
    $attendanceCounts[$row['status']] = (int) $row['total'];
}
$attendanceTotal = array_sum($attendanceCounts);
$attendanceRate = $attendanceTotal > 0
    ? round((($attendanceCounts['present'] + $attendanceCounts['late'] + $attendanceCounts['half_day']) / $attendanceTotal) * 100, 1)
    : 0;

// ---- Leave usage by type (approved, all-time) -------------------------
$leaveByType = $db->query(
    "SELECT leave_type, COUNT(*) AS total, COALESCE(SUM(DATEDIFF(end_date, start_date) + 1),0) AS total_days
     FROM leave_requests WHERE status = 'approved'
     GROUP BY leave_type"
)->fetchAll();

// ---- Recruitment funnel (all postings) ---------------------------------
$recruitmentFunnel = $db->query(
    "SELECT stage, COUNT(*) AS total FROM candidates GROUP BY stage"
)->fetchAll();

sendResponse(true, 'Report data fetched successfully.', [
    'headcount_trend'     => $headcount,
    'department_distribution' => $byDepartment,
    'payroll_by_month'    => $payrollByMonth,
    'attendance'          => [
        'counts' => $attendanceCounts,
        'rate'   => $attendanceRate,
    ],
    'leave_by_type'       => $leaveByType,
    'recruitment_funnel'  => $recruitmentFunnel,
]);
