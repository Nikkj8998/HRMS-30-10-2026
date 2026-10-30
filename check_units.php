<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
try {
    $db = getDB();
    $units = $db->query("SELECT * FROM units")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($units);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
