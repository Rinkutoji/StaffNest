<?php
/**
 * Lightweight token-based authentication (no external JWT library needed).
 *
 * Flow:
 *  - login.php creates a random 64-char token, stores it in `auth_tokens`
 *    with an expiry, and returns it to the client.
 *  - The React app stores the token in localStorage and sends it back as:
 *        Authorization: Bearer <token>
 *  - requireAuth() below reads that header, checks the token exists and
 *    has not expired, and returns the logged-in user's data.
 */

require_once __DIR__ . '/response.php';

function generateToken()
{
    return bin2hex(random_bytes(32)); // 64 character random string
}

function getBearerToken()
{
    $headers = [];

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    }

    // Fallback for servers where getallheaders() isn't available
    $authHeader = $headers['Authorization']
        ?? $headers['authorization']
        ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? null);

    if (!$authHeader) {
        return null;
    }

    if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        return $matches[1];
    }

    return null;
}

/**
 * Validates the request's bearer token.
 * Ends the request with a 401 JSON error if invalid/expired/missing.
 * Returns an associative array of the authenticated user on success.
 */
function requireAuth(PDO $db)
{
    $token = getBearerToken();

    if (!$token) {
        sendError('Authentication token missing.', 401);
    }

    $stmt = $db->prepare(
        'SELECT u.id, u.name, u.email, u.phone, u.profile_image, u.role, u.employee_id
         FROM auth_tokens t
         INNER JOIN users u ON u.id = t.user_id
         WHERE t.token = :token AND t.expires_at > NOW()'
    );
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();

    if (!$user) {
        sendError('Session expired. Please log in again.', 401);
    }

    return $user;
}

/**
 * Restrict an endpoint to specific roles, e.g. requireRole($user, ['admin']);
 */
function requireRole(array $user, array $allowedRoles)
{
    if (!in_array($user['role'], $allowedRoles, true)) {
        sendError('You do not have permission to perform this action.', 403);
    }
}
