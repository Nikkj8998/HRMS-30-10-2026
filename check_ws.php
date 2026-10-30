<?php
$files = [
    'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/index.php',
    'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/helpers/Response.php',
    'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/helpers/Auth.php',
    'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/controllers/PayrollController.php'
];

foreach ($files as $file) {
    if (!file_exists($file)) continue;
    $content = file_get_contents($file);
    if (strpos($content, '<?php') !== 0) {
        echo "Leading content in $file: [" . substr($content, 0, 10) . "]\n";
    }
    if (substr(trim($content), -2) === '?>') {
        echo "Trailing closing tag in $file (avoid this)\n";
    }
}
echo "Check done.\n";
