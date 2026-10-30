<?php

class Response {
    public static function json($data, int $status = 200): void {
        while (ob_get_level()) ob_end_clean(); // Clear any existing buffers to avoid junk output
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        $output = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($output === false) {
            $output = json_encode(['message' => 'JSON encoding failed', 'error' => json_last_error_msg()]);
        }
        header('Content-Length: ' . strlen($output));
        echo $output;
        exit;
    }

    public static function error(string $message, int $status = 400, array $extras = []): void {
        $body = array_merge(['message' => $message], $extras);
        self::json($body, $status);
    }

    public static function noContent(): void {
        http_response_code(204);
        exit;
    }

    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Not found'): void {
        self::error($message, 404);
    }

    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 500);
    }
}
