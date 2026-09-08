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

$jobPostingId = $_GET['job_posting_id'] ?? '';
$stage        = $_GET['stage'] ?? '';

$where = [];
$params = [];
if ($jobPostingId !== '') {
    $where[] = 'c.job_posting_id = :job_posting_id';
    $params['job_posting_id'] = (int) $jobPostingId;
}
if ($stage !== '') {
    $where[] = 'c.stage = :stage';
    $params['stage'] = $stage;
}
$whereSql = count($where) ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $db->prepare(
    "SELECT c.id, c.job_posting_id, j.title AS job_title, c.full_name, c.email, c.phone,
            c.notes, c.stage, c.applied_at, c.created_at
     FROM candidates c
     INNER JOIN job_postings j ON j.id = c.job_posting_id
     $whereSql
     ORDER BY c.created_at DESC"
);
$stmt->execute($params);
$candidates = $stmt->fetchAll();

sendResponse(true, 'Candidates fetched successfully.', ['candidates' => $candidates]);
