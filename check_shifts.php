<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$stmt = $db->query("SELECT sa.*, s.name as shift_name, u.first_name, u.last_name 
                    FROM shift_assignments sa 
                    JOIN shifts s ON s.id = sa.shift_id 
                    JOIN users u ON u.id = sa.user_id");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
