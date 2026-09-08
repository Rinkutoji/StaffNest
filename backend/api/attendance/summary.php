<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
requireAuth($db);

$date = $_GET['date'] ?? date('Y-m-d');
if (!DateTime::createFromFormat('Y-m-d', $date)) {
    sendError('A valid date (YYYY-MM-DD) is required.', 422);
}

$totalActive = (int) $db->query("SELECT COUNT(*) AS c FROM employees WHERE status = 'active'")->fetch()['c'];

$stmt = $db->prepare(
    "SELECT status, COUNT(*) AS total FROM attendance WHERE date = :date GROUP BY status"
);
$stmt->execute(['date' => $date]);
$rows = $stmt->fetchAll();

$counts = ['present' => 0, 'absent' => 0, 'late' => 0, 'half_day' => 0];
foreach ($rows as $row) {
    $counts[$row['status']] = (int) $row['total'];
}
$marked = array_sum($counts);
$counts['not_marked'] = max(0, $totalActive - $marked);

sendResponse(true, 'Attendance summary fetched.', [
    'date'          => $date,
    'total_active'  => $totalActive,
    'counts'        => $counts,
]);
