<?php
require_once __DIR__ . '/php-backend/config/database.php';
require_once __DIR__ . '/php-backend/helpers/Auth.php';
$db = getDB();
echo "=== Test JOIN Result ===\n";
$stmt = $db->query('SELECT sa.*, s.name as shift_name, u.first_name, u.last_name 
                    FROM shift_assignments sa 
                    JOIN shifts s ON s.id = sa.shift_id 
                    JOIN users u ON u.id = sa.user_id');
$raw = $stmt->fetchAll();
print_r($raw);

echo "\n=== Camelized Result ===\n";
print_r(Auth::camelize($raw));
