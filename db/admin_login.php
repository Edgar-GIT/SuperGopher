<?php
require __DIR__ . "/main.php";
require __DIR__ . "/helpers.php";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "admin123";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    redirecionar("../index.php");
}

$user = trim($_POST["user"] ?? "");
$password = $_POST["password"] ?? "";
$adm_p_h = password_hash(ADMIN_PASSWORD, PASSWORD_DEFAULT);

if ($user === ADMIN_USER && password_verify($password, $adm_p_h)) {
    $_SESSION["admin"] = true;
    redirecionar("./admin.php");
}

recado_admin("Credenciais de admin invalidas");
redirecionar("../index.php");
