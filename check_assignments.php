<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$stmt = $db->query("SELECT * FROM shift_assignments LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
