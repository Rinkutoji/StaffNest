<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$db = getDBConnection();
$user = requireAuth($db);
requireRole($user, ['admin', 'hr']);

$input = getJsonInput();
$jobPostingId = (int) ($input['job_posting_id'] ?? 0);
$fullName = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$notes = trim($input['notes'] ?? '');

if ($jobPostingId <= 0) {
    sendError('Please select a job posting.', 422);
}
if ($fullName === '') {
    sendError('Candidate name is required.', 422);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('A valid email address is required.', 422);
}

$existing = $db->prepare('SELECT id FROM job_postings WHERE id = :id');
$existing->execute(['id' => $jobPostingId]);
if (!$existing->fetch()) {
    sendError('Job posting not found.', 404);
}

$stmt = $db->prepare(
    'INSERT INTO candidates (job_posting_id, full_name, email, phone, notes, stage, applied_at)
     VALUES (:job_posting_id, :full_name, :email, :phone, :notes, "applied", CURDATE())'
);
$stmt->execute([
    'job_posting_id' => $jobPostingId,
    'full_name'      => $fullName,
    'email'          => $email,
    'phone'          => $phone !== '' ? $phone : null,
    'notes'          => $notes !== '' ? $notes : null,
]);

sendResponse(true, 'Candidate added successfully.', ['id' => (int) $db->lastInsertId()], 201);
