<?php
/**
 * Database connection (PDO)
 * Automatically loads Environment Variables on Render, with fallback defaults for local XAMPP.
 */

// Force Cambodia timezone (UTC+7) for all PHP date/time calculations
date_default_timezone_set('Asia/Phnom_Penh');

// Read Render Environment Variables with local XAMPP fallback defaults
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'employee_management');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '');

function getDBConnection()
{
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $db = new PDO($dsn, DB_USER, DB_PASS, $options);

        // Keep MySQL session timezone synchronized with Cambodia (+07:00)
        $db->exec("SET time_zone = '+07:00'");

        return $db;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage(),
        ]);
        exit;
    }
}