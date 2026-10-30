<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/controllers/EmployeeController.php';

$db = getDB();
$user = ['id' => 2, 'role' => 'hr', 'departmentId' => 1];

$sql  = 'SELECT COUNT(*) FROM users u LEFT JOIN departments d ON d.id=u.department_id';
$where = [];
$params = [];

$authorizedUnit = 1; // From test_auth
$where[] = "d.unit_id = ?";
$params[] = $authorizedUnit;

$sql .= ' WHERE ' . implode(' AND ', $where);
$stmt = $db->prepare($sql);
$stmt->execute($params);
echo "Count: " . $stmt->fetchColumn() . "\n";
