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

$stmt = $db->query(
    'SELECT d.id, d.name, d.description, d.created_at,
            COUNT(e.id) AS employee_count
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id
     GROUP BY d.id, d.name, d.description, d.created_at
     ORDER BY d.name ASC'
);
$departments = $stmt->fetchAll();

sendResponse(true, 'Departments fetched successfully.', ['departments' => $departments]);
