<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
$db = getDB();
$total = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
$withDept = $db->query("SELECT COUNT(*) FROM users WHERE department_id IS NOT NULL")->fetchColumn();
$units = $db->query("SELECT unit_id, COUNT(*) as count FROM departments GROUP BY unit_id")->fetchAll();
echo "Total Users: $total\n";
echo "Users with Dept: $withDept\n";
echo "Departments by Unit:\n";
print_r($units);
