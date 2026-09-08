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

// ---- Read query params -------------------------------------------------
$search       = trim($_GET['search'] ?? '');
$departmentId = $_GET['department_id'] ?? '';
$gender       = $_GET['gender'] ?? '';
$status       = $_GET['status'] ?? '';
$salaryMin    = $_GET['salary_min'] ?? '';
$salaryMax    = $_GET['salary_max'] ?? '';
$sort         = $_GET['sort'] ?? 'latest';
$page         = max(1, (int) ($_GET['page'] ?? 1));
$limit        = (int) ($_GET['limit'] ?? 10);
if (!in_array($limit, [10, 20, 50], true)) {
    $limit = 10;
}
$offset = ($page - 1) * $limit;

// ---- Build WHERE clause dynamically & safely ---------------------------
$where  = [];
$params = [];

if ($search !== '') {
    // Note: PDO (with native prepares) does not allow reusing the same
    // named placeholder more than once in a query, so we use three
    // distinct placeholders bound to the same value.
    $where[] = '(e.full_name LIKE :search1 OR e.email LIKE :search2 OR e.position LIKE :search3)';
    $params['search1'] = '%' . $search . '%';
    $params['search2'] = '%' . $search . '%';
    $params['search3'] = '%' . $search . '%';
}
if ($departmentId !== '') {
    $where[] = 'e.department_id = :department_id';
    $params['department_id'] = (int) $departmentId;
}
if ($gender !== '') {
    $where[] = 'e.gender = :gender';
    $params['gender'] = $gender;
}
if ($status !== '') {
    $where[] = 'e.status = :status';
    $params['status'] = $status;
}
if ($salaryMin !== '') {
    $where[] = 'e.salary >= :salary_min';
    $params['salary_min'] = (float) $salaryMin;
}
if ($salaryMax !== '') {
    $where[] = 'e.salary <= :salary_max';
    $params['salary_max'] = (float) $salaryMax;
}

$whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';

// ---- Sorting (whitelisted to avoid SQL injection via ORDER BY) --------
$sortOptions = [
    'name_asc'    => 'e.full_name ASC',
    'name_desc'   => 'e.full_name DESC',
    'salary_high' => 'e.salary DESC',
    'salary_low'  => 'e.salary ASC',
    'latest'      => 'e.created_at DESC',
];
$orderBy = $sortOptions[$sort] ?? $sortOptions['latest'];

// ---- Total count for pagination ---------------------------------------
$countStmt = $db->prepare("SELECT COUNT(*) AS total FROM employees e $whereSql");
$countStmt->execute($params);
$total = (int) $countStmt->fetch()['total'];

// ---- Fetch page of results ----------------------------------------------
$sql = "SELECT e.id, e.full_name, e.email, e.phone, e.gender, e.date_of_birth,
               e.position, e.salary, e.department_id, d.name AS department_name,
               e.address, e.profile_image, e.status, e.created_at
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        $whereSql
        ORDER BY $orderBy
        LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$employees = $stmt->fetchAll();

sendResponse(true, 'Employees fetched successfully.', [
    'employees'   => $employees,
    'pagination'  => [
        'total'       => $total,
        'page'        => $page,
        'limit'       => $limit,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
