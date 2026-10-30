<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();

$standardDepts = [
    "Human Resources" => "HR",
    "Finance & Accounts" => "FIN",
    "Operations" => "OPS",
    "Sales & Marketing" => "SAL",
    "Information Technology" => "IT"
];

$unitsToFix = [
    3 => "Praj (HQ)",
    4 => "Praj (Urawade)",
    5 => "Praj (Bhor)",
    7 => "SunPharma (Pune)",
    8 => "SunPharma (Thane)",
    9 => "Titan",
    6 => "Finolex"
];

foreach ($unitsToFix as $unitId => $unitName) {
    echo "Processing Unit: $unitName (ID: $unitId)\n";
    
    try {
        $unitCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $unitName), 0, 3));
        
        // 1. Ensure departments exist
        foreach ($standardDepts as $deptName => $abbr) {
            $stmt = $db->prepare("SELECT id FROM departments WHERE unit_id = ? AND name = ?");
            $stmt->execute([$unitId, $deptName]);
            if (!$stmt->fetch()) {
                $code = "{$unitCode}-{$abbr}";
                $stmtInsert = $db->prepare("INSERT INTO departments (name, unit_id, description, code) VALUES (?, ?, ?, ?)");
                $stmtInsert->execute([$deptName, $unitId, "Standard $deptName department for $unitName", $code]);
                echo "  Created department: $deptName (Code: $code)\n";
            }
        }
        
        // 2. Get all departments for this unit (including existing ones)
        $stmtDepts = $db->prepare("SELECT id FROM departments WHERE unit_id = ?");
        $stmtDepts->execute([$unitId]);
        $deptIds = $stmtDepts->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($deptIds) <= 1) {
            echo "  WARNING: Not enough departments for redistribution.\n";
            continue;
        }
        
        // 3. Get all employees in this unit
        $stmtEmps = $db->prepare("
            SELECT u.id FROM users u 
            JOIN departments d ON u.department_id = d.id 
            WHERE d.unit_id = ?
        ");
        $stmtEmps->execute([$unitId]);
        $empIds = $stmtEmps->fetchAll(PDO::FETCH_COLUMN);
        echo "  Found " . count($empIds) . " employees to redistribute.\n";
        
        // 4. Redistribute
        $i = 0;
        $stmtUpdate = $db->prepare("UPDATE users SET department_id = ? WHERE id = ?");
        foreach ($empIds as $empId) {
            $targetDeptId = $deptIds[$i % count($deptIds)];
            $stmtUpdate->execute([$targetDeptId, $empId]);
            $i++;
        }
        echo "  Redistributed " . count($empIds) . " employees across " . count($deptIds) . " departments.\n";
    } catch (Exception $e) {
        echo "  ERROR: " . $e->getMessage() . "\n";
    }
}
echo "Redistribution complete.\n";
