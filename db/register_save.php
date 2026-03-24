<?php
require __DIR__ . "/main.php";
require __DIR__ . "/helpers.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    redirecionar("../index.php");
}

if ($db_error !== "") {
    responder_erro_bd($db_error);
}

$nome = limpar_nome($_POST["name"] ?? "");
$password = $_POST["password"] ?? "";
$score = intval($_POST["score"] ?? -1);
$time = intval($_POST["time"] ?? -1);
$lives = intval($_POST["lives_lost"] ?? -1);

if (!validar_nome($nome)) {
    recado_menu("Nome invalido", "error");
    redirecionar("../index.php");
}
if (!validar_password($password)) {
    recado_menu("Password invalida", "error");
    redirecionar("../index.php");
}
if ($score < 0 || $time < 0 || $lives < 0) {
    recado_menu("Dados invalidos", "error");
    redirecionar("../index.php");
}

$stmt = $mysql->prepare("SELECT id FROM a17132_users WHERE nome = ? LIMIT 1");
if (!$stmt) {
    responder_erro_bd("Erro na base de dados: (" . $mysql->errno . ") " . $mysql->error);
}
$stmt->bind_param("s", $nome);
$stmt->execute();
$stmt->store_result();
$exists = $stmt->num_rows > 0;
$stmt->close();

if ($exists) {
    recado_menu("Nome ja existe", "error");
    redirecionar("../index.php");
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$mysql->begin_transaction();

$stmt = $mysql->prepare("INSERT INTO a17132_users (nome, password_hash) VALUES (?, ?)");
if (!$stmt) {
    $mysql->rollback();
    responder_erro_bd("Erro na base de dados: (" . $mysql->errno . ") " . $mysql->error);
}
$stmt->bind_param("ss", $nome, $hash);
$ok_user = $stmt->execute();
$user_id = $mysql->insert_id;
$stmt->close();

if (!$ok_user) {
    $mysql->rollback();
    recado_menu("Erro ao criar conta", "error");
    redirecionar("../index.php");
}

$stmt = $mysql->prepare("INSERT INTO a17132_stats (user_id, player_name, score, time_elapsed, lives_lost) VALUES (?, ?, ?, ?, ?)");
if (!$stmt) {
    $mysql->rollback();
    responder_erro_bd("Erro na base de dados: (" . $mysql->errno . ") " . $mysql->error);
}
$stmt->bind_param("isiii", $user_id, $nome, $score, $time, $lives);
$ok_stat = $stmt->execute();
$stmt->close();

if (!$ok_stat) {
    $mysql->rollback();
    recado_menu("Erro ao guardar", "error");
    redirecionar("../index.php");
}

$mysql->commit();
recado_menu("Estatisticas guardadas com sucesso", "success");
redirecionar("../index.php");
