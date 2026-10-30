<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$stmt = $db->prepare('SELECT id, first_name, last_name FROM users WHERE username = ?');
$stmt->execute(['emp_demo']);
print_r($stmt->fetch());
