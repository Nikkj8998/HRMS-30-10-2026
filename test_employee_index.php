<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/helpers/Auth.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/controllers/EmployeeController.php';

// Simulate logged in user
$db = getDB();
$stmt = $db->prepare('SELECT u.*, d.name AS department_name FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.username="nikita2" LIMIT 1');
$stmt->execute();
$userRaw = $stmt->fetch();
$user = Auth::sanitizeUser($userRaw);

$c = new EmployeeController();
// mock Response::json so it doesn't exit
class MockResponse {
    public static $data;
    public static function json($data, $status = 200) {
        self::$data = $data;
    }
}
// wait, Response is already loaded and uses exit;
// Let's just run the code from EmployeeController::index inline
$sql  = 'SELECT u.*, d.name AS department_name FROM users u LEFT JOIN departments d ON d.id=u.department_id';
$params = [];
$where = [];

if ($user['role'] !== 'developer') {
    $where[] = "u.role != ?";
    $params[] = 'developer';
}

$authorizedUnit = Auth::getAuthorizedUnitId($user);
if ($authorizedUnit !== null) {
    if ($authorizedUnit === false) {
        $where[] = "u.id = ?";
        $params[] = $user['id'];
    } else {
        $where[] = "d.unit_id = ?";
        $params[] = $authorizedUnit;
    }
}

if (!empty($where)) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY u.id';

echo "SQL: $sql\n";
echo "Params: " . print_r($params, true) . "\n";
echo "Authorized Unit: " . var_export($authorizedUnit, true) . "\n";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();
echo "Count: " . count($rows) . "\n";
