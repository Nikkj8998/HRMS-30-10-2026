<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
$db = getDB();
$stmt = $db->query("SELECT * FROM users WHERE username LIKE '%navnath%' OR first_name LIKE '%navnath%'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
