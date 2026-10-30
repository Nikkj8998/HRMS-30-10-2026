<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/helpers/Auth.php';

$db = getDB();
$userRaw = $db->query("SELECT * FROM users WHERE id = 2")->fetch();
$user = Auth::sanitizeUser($userRaw);

echo "User Role: " . $user['role'] . "\n";
echo "User Dept: " . $user['departmentId'] . "\n";
$authUnit = Auth::getAuthorizedUnitId($user);
var_dump($authUnit);
