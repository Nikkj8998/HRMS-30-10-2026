<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
$db=getDB();
$stmt=$db->query('SELECT documents FROM users WHERE JSON_LENGTH(documents)>0 LIMIT 1');
$row = $stmt->fetch();
$docs = json_decode($row['documents'], true);
$doc = json_decode($docs[0], true);
echo substr($doc['data'], 0, 50) . "...\n";
