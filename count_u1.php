<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
$db = getDB();
$count = $db->query("SELECT COUNT(*) FROM users u JOIN departments d ON u.department_id = d.id WHERE d.unit_id = 1")->fetchColumn();
echo "Users in Unit 1: $count\n";
