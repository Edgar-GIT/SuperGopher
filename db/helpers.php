<?php
function limpar_nome($nome) {
    $nome = trim($nome);
    $nome = preg_replace("/\s+/", " ", $nome);
    return $nome;
}

function validar_nome($nome) {
    $nome = limpar_nome($nome);
    if ($nome === "") return false;
    if (mb_strlen($nome, "UTF-8") < 3 || mb_strlen($nome, "UTF-8") > 24) return false;
    if (!preg_match("/^[\p{L}0-9 ]+$/u", $nome)) return false;
    return true;
}

function validar_password($password) {
    return is_string($password) && strlen($password) >= 4;
}

function guardar_recado($chave, $valor) {
    if (!isset($_SESSION["recados"]) || !is_array($_SESSION["recados"])) {
        $_SESSION["recados"] = array();
    }
    $_SESSION["recados"][$chave] = $valor;
}

function ler_recado($chave, $default = "") {
    if (!isset($_SESSION["recados"]) || !array_key_exists($chave, $_SESSION["recados"])) {
        return $default;
    }
    $valor = $_SESSION["recados"][$chave];
    unset($_SESSION["recados"][$chave]);
    if (empty($_SESSION["recados"])) {
        unset($_SESSION["recados"]);
    }
    return $valor;
}

function redirecionar($url) {
    header("Location: " . $url);
    exit;
}

function recado_menu($msg, $type = "error") {
    guardar_recado("menu_msg", $msg);
    guardar_recado("menu_msg_type", $type);
}

function recado_admin($msg) {
    guardar_recado("admin_login_msg", $msg);
    guardar_recado("open_admin_modal", "1");
}

function responder_erro_bd($db_error, $url = "../index.php") {
    $msg = $db_error !== "" ? $db_error : "Erro de base de dados";
    recado_menu($msg, "error");
    redirecionar($url);
}
