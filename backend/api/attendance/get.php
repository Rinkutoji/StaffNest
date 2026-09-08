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

$date         = $_GET['date'] ?? '';
$dateFrom     = $_GET['date_from'] ?? '';
$dateTo       = $_GET['date_to'] ?? '';
$employeeId   = $_GET['employee_id'] ?? '';
$departmentId = $_GET['department_id'] ?? '';
$status       = $_GET['status'] ?? '';
$search       = trim($_GET['search'] ?? '');
$page         = max(1, (int) ($_GET['page'] ?? 1));
$limit        = (int) ($_GET['limit'] ?? 10);
if (!in_array($limit, [10, 20, 50], true)) {
    $limit = 10;
}
$offset = ($page - 1) * $limit;

// Employees can only ever see their own attendance - ignore any
// employee_id/department_id/search they might pass and force it to
// their own linked HR record instead.
if ($authUser['role'] === 'employee') {
    if (!$authUser['employee_id']) {
        sendResponse(true, 'No employee record is linked to this account yet.', [
            'attendance' => [],
            'pagination' => ['total' => 0, 'page' => 1, 'limit' => $limit, 'total_pages' => 1],
        ]);
    }
    $employeeId = $authUser['employee_id'];
    $departmentId = '';
    $search = '';
}

$where  = [];
$params = [];

if ($date !== '') {
    $where[] = 'a.date = :date';
    $params['date'] = $date;
}
if ($dateFrom !== '') {
    $where[] = 'a.date >= :date_from';
    $params['date_from'] = $dateFrom;
}
if ($dateTo !== '') {
    $where[] = 'a.date <= :date_to';
    $params['date_to'] = $dateTo;
}
if ($employeeId !== '') {
    $where[] = 'a.employee_id = :employee_id';
    $params['employee_id'] = (int) $employeeId;
}
if ($departmentId !== '') {
    $where[] = 'e.department_id = :department_id';
    $params['department_id'] = (int) $departmentId;
}
if ($status !== '') {
    $where[] = 'a.status = :status';
    $params['status'] = $status;
}
if ($search !== '') {
    $where[] = 'e.full_name LIKE :search';
    $params['search'] = '%' . $search . '%';
}

$whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $db->prepare("SELECT COUNT(*) AS total FROM attendance a INNER JOIN employees e ON e.id = a.employee_id $whereSql");
$countStmt->execute($params);
$total = (int) $countStmt->fetch()['total'];

$sql = "SELECT a.id, a.employee_id, e.full_name, e.profile_image, e.department_id, d.name AS department_name,
               a.date, a.status, a.check_in, a.check_out, a.notes
        FROM attendance a
        INNER JOIN employees e ON e.id = a.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        $whereSql
        ORDER BY a.date DESC, e.full_name ASC
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$records = $stmt->fetchAll();

sendResponse(true, 'Attendance fetched successfully.', [
    'attendance' => $records,
    'pagination' => [
        'total'       => $total,
        'page'        => $page,
        'limit'       => $limit,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
