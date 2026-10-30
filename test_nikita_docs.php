<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/helpers/Auth.php';

$db = getDB();
$stmt = $db->query('SELECT documents FROM users WHERE JSON_LENGTH(documents) > 0 LIMIT 1');
$row = $stmt->fetch();
print_r(json_decode($row['documents'], true));
