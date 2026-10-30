<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$stmt = $db->query('SELECT id, first_name, last_name, salary FROM users');
print_r($stmt->fetchAll());
