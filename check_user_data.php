<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
$db = getDB();
$sql = "SELECT u.id, u.username, u.first_name, u.last_name, u.role, u.department_id, d.unit_id 
        FROM users u 
        LEFT JOIN departments d ON u.department_id = d.id 
        WHERE u.first_name LIKE '%Nikita%' OR u.username LIKE '%Nikita%'";
$stmt = $db->query($sql);
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
