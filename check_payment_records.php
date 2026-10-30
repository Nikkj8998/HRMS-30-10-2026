<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
$db = getDB();
$stmt = $db->query("DESCRIBE payment_records");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
