<?php
/**
 * Shared logic used by both create.php and update.php so the two
 * endpoints don't duplicate validation / file-upload code.
 */

require_once __DIR__ . '/response.php';

/**
 * Validates $_POST fields for an employee record.
 * Returns a clean associative array of validated values.
 * Sends a 422 error response (and exits) if anything is invalid.
 */
function validateEmployeeInput(array $input, PDO $db, ?int $ignoreId = null)
{
    $fullName     = trim($input['full_name'] ?? '');
    $email        = trim($input['email'] ?? '');
    $phone        = trim($input['phone'] ?? '');
    $gender       = trim($input['gender'] ?? 'other');
    $dateOfBirth  = trim($input['date_of_birth'] ?? '');
    $position     = trim($input['position'] ?? '');
    $salary       = $input['salary'] ?? '';
    $departmentId = $input['department_id'] ?? '';
    $address      = trim($input['address'] ?? '');
    $status       = trim($input['status'] ?? 'active');

    if ($fullName === '') {
        sendError('Full name is required.', 422);
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('A valid email address is required.', 422);
    }
    if (!is_numeric($salary) || (float) $salary < 0) {
        sendError('Salary must be a valid positive number.', 422);
    }
    if (!in_array($gender, ['male', 'female', 'other'], true)) {
        sendError('Gender must be male, female or other.', 422);
    }
    if (!in_array($status, ['active', 'inactive'], true)) {
        sendError('Status must be active or inactive.', 422);
    }
    if ($dateOfBirth !== '' && !DateTime::createFromFormat('Y-m-d', $dateOfBirth)) {
        sendError('Date of birth must be in YYYY-MM-DD format.', 422);
    }

    // Uniqueness check for email
    $sql = 'SELECT id FROM employees WHERE email = :email';
    $params = ['email' => $email];
    if ($ignoreId !== null) {
        $sql .= ' AND id != :id';
        $params['id'] = $ignoreId;
    }
    $check = $db->prepare($sql);
    $check->execute($params);
    if ($check->fetch()) {
        sendError('Another employee already uses this email.', 409);
    }

    return [
        'full_name'     => $fullName,
        'email'         => $email,
        'phone'         => $phone !== '' ? $phone : null,
        'gender'        => $gender,
        'date_of_birth' => $dateOfBirth !== '' ? $dateOfBirth : null,
        'position'      => $position !== '' ? $position : null,
        'salary'        => (float) $salary,
        'department_id' => $departmentId !== '' ? (int) $departmentId : null,
        'address'       => $address !== '' ? $address : null,
        'status'        => $status,
    ];
}

/**
 * Moves an uploaded profile image into /uploads/profiles and returns
 * the stored filename, or null if no file was uploaded.
 * Sends a 422 error response (and exits) if the file is invalid.
 */
function handleProfileImageUpload(): ?string
{
    if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $file = $_FILES['profile_image'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        sendError('Image upload failed. Please try again.', 422);
    }

    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, $allowedTypes, true)) {
        sendError('Profile image must be a JPG, PNG or WEBP file.', 422);
    }

    $maxSizeBytes = 2 * 1024 * 1024; // 2MB
    if ($file['size'] > $maxSizeBytes) {
        sendError('Profile image must be smaller than 2MB.', 422);
    }

    $extensionMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $extension = $extensionMap[$mimeType];
    $filename = uniqid('emp_', true) . '.' . $extension;
    $destination = __DIR__ . '/../uploads/profiles/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        sendError('Could not save the uploaded image.', 500);
    }

    return $filename;
}

/**
 * Deletes a previously stored profile image file (used when replacing
 * or removing an employee's photo).
 */
function deleteProfileImage(?string $filename): void
{
    if (!$filename) {
        return;
    }
    $path = __DIR__ . '/../uploads/profiles/' . $filename;
    if (is_file($path)) {
        @unlink($path);
    }
}
