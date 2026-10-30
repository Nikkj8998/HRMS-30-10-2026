<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$stmt = $db->query("DESCRIBE users");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
