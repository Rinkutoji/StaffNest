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

$status = $_GET['status'] ?? '';
$where = [];
$params = [];
if ($status !== '') {
    $where[] = 'j.status = :status';
    $params['status'] = $status;
}
$whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $db->prepare(
    "SELECT j.id, j.title, j.department_id, d.name AS department_name, j.description, j.status, j.created_at,
            COUNT(c.id) AS candidate_count
     FROM job_postings j
     LEFT JOIN departments d ON d.id = j.department_id
     LEFT JOIN candidates c ON c.job_posting_id = j.id
     $whereSql
     GROUP BY j.id, j.title, j.department_id, d.name, j.description, j.status, j.created_at
     ORDER BY j.created_at DESC"
);
$stmt->execute($params);
$postings = $stmt->fetchAll();

sendResponse(true, 'Job postings fetched successfully.', ['job_postings' => $postings]);
