<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Response.php';

class PayrollController {

    public function calculate(array $user, array $body): void {
        $salary          = (float)($body['salary']           ?? 0);
        $overtimeHours   = (float)($body['overtimeHours']    ?? 0);
        $daysWorked      = (float)($body['daysWorked']       ?? 25);
        $totalDays       = (float)($body['totalDaysInMonth'] ?? 30);

        $settings        = $this->getSettings();
        $sc              = $settings['salaryComponents'] ?? [];
        $basicPct        = (float)($sc['basicSalaryPercentage'] ?? 50);
        $hraPct          = (float)($sc['hraPercentage']         ?? 50);
        $epfPct          = (float)($sc['epfPercentage']         ?? 12);
        $esicPct         = (float)($sc['esicPercentage']        ?? 0.75);
        $ptFixed         = (float)($sc['professionalTax']       ?? 200);

        // Pro-rated gross
        $gross   = ($salary / $totalDays) * $daysWorked;
        $basic   = $gross * ($basicPct / 100);
        $hra     = $basic * ($hraPct / 100);
        $da      = $basic * 0.10;
        
        // Conveyance & Medical pro-rated
        $conveyance = round((1600 / $totalDays) * $daysWorked);
        $medical = round((1250 / $totalDays) * $daysWorked);
        
        $lta     = $basic * 0.04;
        $childAll = $basic * 0.04;
        $othAll  = $basic * 0.06;
        
        // Statutory Bonus: 8.33% of Basic capped at 7,000
        $bonus = round(min($basic, 7000) * 0.0833);

        $otRate   = (($basic + $da) / 26 / 8) * 2;
        $otAmount = $overtimeHours * $otRate;

        $earningsBeforeSpecial = $basic + $da + $hra + $conveyance + $medical + $lta + $childAll + $othAll + $otAmount + $bonus;
        $specialAllowance      = max(0, $gross - $earningsBeforeSpecial);

        // Statutory deductions
        $basicLimit  = 15000;
        $epfEmployee = round(min($basic, $basicLimit) * ($epfPct / 100));
        $epfEmployer = round(min($basic, $basicLimit) * 0.13); // Employer PF (13%)

        $esicEmployee = $gross <= 21000 ? round($gross * ($esicPct / 100)) : 0;
        $esicEmployer = $gross <= 21000 ? round($gross * 0.0325) : 0; // Employer ESIC (3.25%)

        $pt  = $ptFixed;
        $mo  = (int)date('m');
        $lwf = ($mo === 6 || $mo === 12) ? 25 : 0;
        $lwfEmployer = ($mo === 6 || $mo === 12) ? 75 : 0;
        
        // Flat 3.7% TDS if gross is above 100,000
        $tds = $gross > 100000 ? round($gross * 0.037) : 0;

        $totalDeductions = $epfEmployee + $esicEmployee + $pt + $lwf + $tds;
        $netSalary       = $gross - $totalDeductions;

        Response::json([
            'earnings'   => [
                'basic' => $basic,
                'da' => $da,
                'hra' => $hra,
                'conveyance' => $conveyance,
                'medical' => $medical,
                'otAmount' => $otAmount,
                'specialAllowance' => $specialAllowance,
                'bonus' => $bonus,
                'gross' => $gross
            ],
            'deductions' => [
                'epf' => $epfEmployee,
                'esic' => $esicEmployee,
                'pt' => $pt,
                'lwf' => $lwf,
                'tds' => $tds,
                'totalDeductions' => $totalDeductions
            ],
            'employerContributions' => [
                'epf' => $epfEmployer,
                'esic' => $esicEmployer,
                'lwf' => $lwfEmployer
            ],
            'netSalary'  => $netSalary,
            'period'     => ['daysWorked'=>$daysWorked,'totalDaysInMonth'=>$totalDays]
        ]);
    }

    public function getPaymentRecords(array $user, array $query): void {
        $db         = getDB();
        $employeeId = isset($query['employeeId']) ? (int)$query['employeeId'] : null;
        $month      = $query['month'] ?? null;

        $canViewAll  = Auth::hasPermission($user, 'payroll.view');
        
        $sql = "SELECT pr.* FROM payment_records pr 
                JOIN users u ON u.id = pr.employee_id 
                LEFT JOIN departments d ON d.id = u.department_id";
        $where = [];
        $params = [];

        // Multi-tenancy / Unit Isolation
        $authorizedUnit = Auth::getAuthorizedUnitId($user);
        if ($authorizedUnit !== null) {
            if ($authorizedUnit === false) {
                $where[] = "pr.employee_id = ?";
                $params[] = $user['id'];
            } else {
                $where[] = "d.unit_id = ?";
                $params[] = $authorizedUnit;
            }
        } elseif (!$canViewAll) {
            $where[] = "pr.employee_id = ?";
            $params[] = $user['id'];
        }

        // Filters
        if ($employeeId) {
            $where[] = "pr.employee_id = ?";
            $params[] = $employeeId;
        }
        if ($month) {
            $where[] = "pr.month = ?";
            $params[] = $month;
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY pr.created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        Response::json(Auth::camelize($stmt->fetchAll()));
    }

    public function createPaymentRecord(array $user, array $body): void {
        if (!Auth::hasPermission($user, 'payroll.process')) Response::forbidden();
        $db   = getDB();
        
        $paymentDate = $body['paymentDate'] ?? null;
        if ($paymentDate) {
            $paymentDate = date('Y-m-d H:i:s', strtotime($paymentDate));
        }

        $empId = (int)($body['employeeId'] ?? 0);

        // Unit Authorization Check
        $authorizedUnit = Auth::getAuthorizedUnitId($user);
        if ($authorizedUnit !== null) {
            if ($authorizedUnit === false) Response::forbidden();
            $checkStmt = $db->prepare("SELECT d.unit_id FROM users u LEFT JOIN departments d ON d.id = u.department_id WHERE u.id=?");
            $checkStmt->execute([$empId]);
            $empUnit = $checkStmt->fetchColumn();
            if ($empUnit !== null && $empUnit !== false && $empUnit != $authorizedUnit) {
                Response::forbidden('Target employee is not in your authorized unit');
            }
        }

        $stmt = $db->prepare(
            'INSERT INTO payment_records (employee_id, month, payment_status, amount, payment_date, payment_mode, reference_no, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            $empId,
            $body['month']               ?? '',
            $body['paymentStatus']       ?? 'pending',
            (int)($body['amount']        ?? 0),
            $paymentDate,
            $body['paymentMode']         ?? null,
            $body['referenceNo']         ?? null,
        ]);
        $id  = (int)$db->lastInsertId();
        $row = $db->prepare('SELECT * FROM payment_records WHERE id=? LIMIT 1');
        $row->execute([$id]);
        Response::json(Auth::camelize($row->fetch()), 201);
    }

    public function updatePaymentRecord(array $user, int $id, array $body): void {
        if (!Auth::hasPermission($user, 'payroll.process')) Response::forbidden();
        $db   = getDB();

        // Unit Authorization Check
        $authorizedUnit = Auth::getAuthorizedUnitId($user);
        if ($authorizedUnit !== null) {
            $checkStmt = $db->prepare("SELECT d.unit_id FROM payment_records pr JOIN users u ON u.id = pr.employee_id LEFT JOIN departments d ON d.id = u.department_id WHERE pr.id=?");
            $checkStmt->execute([$id]);
            $empUnit = $checkStmt->fetchColumn();
            if ($empUnit !== null && $empUnit !== false && $empUnit != $authorizedUnit) {
                Response::forbidden('This record belongs to an employee outside your authorized unit');
            }
        }

        if (isset($body['paymentDate']) && $body['paymentDate']) {
            $body['paymentDate'] = date('Y-m-d H:i:s', strtotime($body['paymentDate']));
        }

        $check = $db->prepare('SELECT id FROM payment_records WHERE id=? LIMIT 1');
        $check->execute([$id]);
        if (!$check->fetch()) Response::notFound('Payment record not found');

        $sets = []; $values = [];
        $cols = ['paymentStatus'=>'payment_status','amount'=>'amount','paymentDate'=>'payment_date','paymentMode'=>'payment_mode','referenceNo'=>'reference_no','month'=>'month'];
        foreach ($cols as $key => $col) {
            if (array_key_exists($key, $body)) { $sets[] = "`{$col}`=?"; $values[] = $body[$key]; }
        }
        if (!empty($sets)) { $values[] = $id; $db->prepare('UPDATE payment_records SET ' . implode(', ', $sets) . ' WHERE id=?')->execute($values); }
        $stmt = $db->prepare('SELECT * FROM payment_records WHERE id=? LIMIT 1');
        $stmt->execute([$id]);
        Response::json(Auth::camelize($stmt->fetch()));
    }

    public function deletePaymentRecord(array $user, int $id): void {
        if (!Auth::hasPermission($user, 'payroll.process')) Response::forbidden();
        $db   = getDB();

        // Unit Authorization Check
        $authorizedUnit = Auth::getAuthorizedUnitId($user);
        if ($authorizedUnit !== null) {
            $checkStmt = $db->prepare("SELECT d.unit_id FROM payment_records pr JOIN users u ON u.id = pr.employee_id LEFT JOIN departments d ON d.id = u.department_id WHERE pr.id=?");
            $checkStmt->execute([$id]);
            $empUnit = $checkStmt->fetchColumn();
            if ($empUnit !== null && $empUnit !== false && $empUnit != $authorizedUnit) {
                Response::forbidden('This record belongs to an employee outside your authorized unit');
            }
        }

        $stmt = $db->prepare('DELETE FROM payment_records WHERE id=?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) Response::notFound('Payment record not found');
        Response::noContent();
    }

    private function getSettings(): array {
        $file = SETTINGS_FILE;
        if (file_exists($file)) return json_decode(file_get_contents($file), true) ?? [];
        return ['salaryComponents' => ['basicSalaryPercentage'=>50,'hraPercentage'=>50,'epfPercentage'=>12,'esicPercentage'=>0.75,'professionalTax'=>200]];
    }
}
