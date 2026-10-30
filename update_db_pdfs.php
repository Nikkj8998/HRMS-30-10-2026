<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';

$pdf = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 135 >>\nstream\nBT \n/F1 18 Tf \n50 150 Td \n(Sample Document Preview) Tj \n/F1 12 Tf \n0 -30 Td \n(This is a real system generated dummy document.) Tj \nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000244 00000 n\n0000000332 00000 n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n517\n%%EOF";
$newBase64 = "data:application/pdf;base64," . base64_encode($pdf);

$db = getDB();
$stmt = $db->query('SELECT id, documents FROM users WHERE JSON_LENGTH(documents) > 0');
$updatedCount = 0;

while ($row = $stmt->fetch()) {
    $docsRaw = json_decode($row['documents'], true);
    if (!is_array($docsRaw)) continue;
    
    $modified = false;
    foreach ($docsRaw as &$docStr) {
        $doc = json_decode($docStr, true);
        if ($doc && isset($doc['data'])) {
            if (strpos($doc['data'], 'JVBERi0xLjQKJcOkw7zDtsOfCjI') !== false || $doc['mimeType'] === 'application/pdf') {
                $doc['data'] = $newBase64;
                $docStr = json_encode($doc);
                $modified = true;
            }
        }
    }
    
    if ($modified) {
        $updateStmt = $db->prepare('UPDATE users SET documents = ? WHERE id = ?');
        $updateStmt->execute([json_encode($docsRaw), $row['id']]);
        $updatedCount++;
    }
}

echo "Updated $updatedCount users with valid sample PDFs.\n";
