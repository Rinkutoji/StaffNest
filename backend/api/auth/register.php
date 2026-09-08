<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$input = getJsonInput();
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = (string) ($input['password'] ?? '');

// Public self-registration only ever creates a plain "employee" account.
// Admin and HR (staff) accounts are provisioned separately (e.g. seeded in
// the database or created by an existing admin) - never through this open
// endpoint, no matter what role value a client sends here.
$role = 'employee';

if ($name === '' || $email === '' || $password === '') {
    sendError('Name, email and password are required.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Please provide a valid email address.', 422);
}

if (strlen($password) < 6) {
    sendError('Password must be at least 6 characters long.', 422);
}

$db = getDBConnection();

$check = $db->prepare('SELECT id FROM users WHERE email = :email');
$check->execute(['email' => $email]);
if ($check->fetch()) {
    sendError('An account with this email already exists.', 409);
}

$hashed = password_hash($password, PASSWORD_BCRYPT);

// Best-effort convenience: if HR has already created an employee record
// with this same email, link the new login to it automatically so
// Attendance/Leave/Payroll self-service pages work right away. If no
// matching record exists yet, employee_id just stays NULL - an Admin/HR
// can link it later by creating/matching the employee record.
$empMatch = $db->prepare('SELECT id FROM employees WHERE email = :email');
$empMatch->execute(['email' => $email]);
$matchedEmployee = $empMatch->fetch();

$insert = $db->prepare(
    'INSERT INTO users (name, email, password, role, employee_id) VALUES (:name, :email, :password, :role, :employee_id)'
);
$insert->execute([
    'name'        => $name,
    'email'       => $email,
    'password'    => $hashed,
    'role'        => $role,
    'employee_id' => $matchedEmployee['id'] ?? null,
]);

sendResponse(true, 'Account created successfully. You can now log in.', [
    'id'    => (int) $db->lastInsertId(),
    'name'  => $name,
    'email' => $email,
    'role'  => $role,
], 201);
