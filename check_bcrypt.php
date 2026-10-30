<?php
$hash = '$2y$12$xcse/mkYLoDTrVNODvmlUOgC./M27ZqI05lj82hqAtFTM.oMnARrC';
$passwords = ["admin", "admin123", "Admin@123", "Admin@1234", "asn123", "asn@123", "password", "123456", "Navnath@123"];

foreach ($passwords as $pw) {
    if (password_verify($pw, $hash)) {
        echo "FOUND! Password for nk@asn.com is: $pw\n";
        exit;
    }
}
echo "No common password matched.\n";
?>
