<?php
/**
 * CORS headers - allows the React (Vite) dev server to call this API.
 * In production, replace '*' with your real frontend domain.
 */
$allowedOrigins = [
    'https://frontend-kappa-khaki-68.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback allowing origin header or wildcard for API clients like Postman
    header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Preflight request short-circuit
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
