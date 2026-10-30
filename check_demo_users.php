<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$usernames = ['admin_demo', 'hr_demo', 'user_demo', 'emp_demo'];
$stmt = $db->prepare('SELECT id, username, expires_at FROM users WHERE username IN (?, ?, ?, ?)');
$stmt->execute($usernames);
print_r($stmt->fetchAll());
