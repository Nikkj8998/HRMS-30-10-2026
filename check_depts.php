<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$stmt = $db->query('SELECT id, name FROM departments');
print_r($stmt->fetchAll());
