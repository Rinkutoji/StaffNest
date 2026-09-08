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

$month      = $_GET['month'] ?? date('Y-m');
$employeeId = $_GET['employee_id'] ?? '';
$status     = $_GET['status'] ?? '';
$page       = max(1, (int) ($_GET['page'] ?? 1));
$limit      = (int) ($_GET['limit'] ?? 20);
if (!in_array($limit, [10, 20, 50], true)) {
    $limit = 20;
}
$offset = ($page - 1) * $limit;

// An Employee-role account can only ever see their own payslips.
if ($authUser['role'] === 'employee') {
    if (!$authUser['employee_id']) {
        sendResponse(true, 'No employee record is linked to this account yet.', [
            'payroll' => [], 'month' => $month,
            'summary' => ['total_paid_net' => 0, 'paid_count' => 0],
            'pagination' => ['total' => 0, 'page' => 1, 'limit' => $limit, 'total_pages' => 1],
        ]);
    }
    $employeeId = $authUser['employee_id'];
}

$showAllMonths = ($_GET['all'] ?? '') === '1' && $authUser['role'] === 'employee';

$where  = $showAllMonths ? [] : ['p.month = :month'];
$params = $showAllMonths ? [] : ['month' => $month];

if ($employeeId !== '') {
    $where[] = 'p.employee_id = :employee_id';
    $params['employee_id'] = (int) $employeeId;
}
if ($status !== '') {
    $where[] = 'p.status = :status';
    $params['status'] = $status;
}

$whereSql = 'WHERE ' . implode(' AND ', $where);

$countStmt = $db->prepare("SELECT COUNT(*) AS total FROM payroll p $whereSql");
$countStmt->execute($params);
$total = (int) $countStmt->fetch()['total'];

$sql = "SELECT p.id, p.employee_id, e.full_name, e.profile_image, d.name AS department_name,
               p.month, p.base_salary, p.bonus, p.deductions, p.net_salary, p.status, p.paid_at
        FROM payroll p
        INNER JOIN employees e ON e.id = p.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        $whereSql
        ORDER BY " . ($showAllMonths ? 'p.month DESC' : 'e.full_name ASC') . "
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$records = $stmt->fetchAll();

if ($showAllMonths) {
    $totals = ['total_net' => 0, 'count_paid' => 0]; // not meaningful across multiple months
} else {
    $totalsStmt = $db->prepare("SELECT COALESCE(SUM(net_salary),0) AS total_net, COUNT(*) AS count_paid
                                 FROM payroll WHERE month = :month AND status = 'paid'");
    $totalsStmt->execute(['month' => $month]);
    $totals = $totalsStmt->fetch();
}

sendResponse(true, 'Payroll fetched successfully.', [
    'payroll'    => $records,
    'month'      => $month,
    'summary'    => [
        'total_paid_net' => (float) $totals['total_net'],
        'paid_count'     => (int) $totals['count_paid'],
    ],
    'pagination' => [
        'total'       => $total,
        'page'        => $page,
        'limit'       => $limit,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
