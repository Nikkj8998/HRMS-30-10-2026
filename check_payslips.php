<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$stmt = $db->prepare('SELECT * FROM payment_records WHERE user_id = ?');
$stmt->execute([1564]);
print_r($stmt->fetchAll());
