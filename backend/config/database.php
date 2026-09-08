<?php
/**
 * Database connection (PDO)
 * Adjust these values to match your local XAMPP / MySQL setup.
 */

// The whole app (attendance clock in/out, "today" for leave/payroll, etc.)
// should run on Cambodia time, regardless of what timezone the underlying
// server/OS happens to be set to (many servers default to UTC). This one
// line fixes every date()/time()/strtotime() call in every PHP file that
// includes this config, since it's required by virtually every endpoint.
date_default_timezone_set('Asia/Phnom_Penh');

define('DB_HOST', 'localhost');
define('DB_NAME', 'employee_management');
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP default root password is empty

function getDBConnection()
{
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $db = new PDO($dsn, DB_USER, DB_PASS, $options);

        // MySQL's own NOW()/CURDATE()/CURRENT_TIMESTAMP/CURRENT_DATE() use
        // the MySQL *server's* timezone setting, not PHP's - so the line
        // above alone isn't enough. Cambodia is UTC+7 year-round (no DST),
        // so setting a fixed offset here works correctly regardless of the
        // server's own system/global timezone configuration, and needs no
        // special MySQL timezone-table setup.
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
