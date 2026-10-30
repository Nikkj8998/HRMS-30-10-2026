<?php
$hash = '$2y$12$HJwqre56fZdmwxdum1ycSuIfvEMdyE3espM1qUf0zkuRnZOk0XAcy';
$passwords = ["admin", "admin123", "Admin@123", "Admin@1234", "asn123", "asn@123", "password", "123456", "Navnath@123", "Welcome@123", "rohan123"];

foreach ($passwords as $pw) {
    if (password_verify($pw, $hash)) {
        echo "FOUND! Password for Rohan is: $pw\n";
        exit;
    }
}
echo "No common password matched.\n";
?>
