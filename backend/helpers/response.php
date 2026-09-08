<?php
/**
 * Small helpers to keep every API response in one consistent JSON shape:
 * { success, message, data }
 */

function sendResponse($success, $message, $data = [], $httpCode = 200)
{
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data,
    ]);
    exit;
}

function sendError($message, $httpCode = 400)
{
    sendResponse(false, $message, [], $httpCode);
}

function getJsonInput()
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}
