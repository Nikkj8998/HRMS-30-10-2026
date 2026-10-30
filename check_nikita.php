<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
$db = getDB();
$user = $db->query("SELECT u.*, d.unit_id FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.firstName LIKE '%Nikita%'")->fetch(PDO::FETCH_ASSOC);
echo json_encode($user);
