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

$employeeId = $_GET['employee_id'] ?? '';
$status     = $_GET['status'] ?? '';
$leaveType  = $_GET['leave_type'] ?? '';
$page       = max(1, (int) ($_GET['page'] ?? 1));
$limit      = (int) ($_GET['limit'] ?? 10);
if (!in_array($limit, [10, 20, 50], true)) {
    $limit = 10;
}
$offset = ($page - 1) * $limit;

if ($authUser['role'] === 'employee') {
    if (!$authUser['employee_id']) {
        sendResponse(true, 'No employee record is linked to this account yet.', [
            'leave_requests' => [],
            'pagination' => ['total' => 0, 'page' => 1, 'limit' => $limit, 'total_pages' => 1],
        ]);
    }
    $employeeId = $authUser['employee_id'];
}

$where  = [];
$params = [];

if ($employeeId !== '') {
    $where[] = 'l.employee_id = :employee_id';
    $params['employee_id'] = (int) $employeeId;
}
if ($status !== '') {
    $where[] = 'l.status = :status';
    $params['status'] = $status;
}
if ($leaveType !== '') {
    $where[] = 'l.leave_type = :leave_type';
    $params['leave_type'] = $leaveType;
}

$whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare("SELECT COUNT(*) AS total FROM leave_requests l $whereSql");
$countStmt->execute($params);
$total = (int) $countStmt->fetch()['total'];

$sql = "SELECT l.id, l.employee_id, e.full_name, e.profile_image, e.department_id, d.name AS department_name,
               l.leave_type, l.start_date, l.end_date,
               DATEDIFF(l.end_date, l.start_date) + 1 AS days,
               l.reason, l.status, l.reviewed_by, u.name AS reviewed_by_name, l.reviewed_at, l.created_at
        FROM leave_requests l
        INNER JOIN employees e ON e.id = l.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN users u ON u.id = l.reviewed_by
        $whereSql
        ORDER BY l.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$records = $stmt->fetchAll();

sendResponse(true, 'Leave requests fetched successfully.', [
    'leave_requests' => $records,
    'pagination'     => [
        'total'       => $total,
        'page'        => $page,
        'limit'       => $limit,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
