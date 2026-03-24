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

if ($nome === "" || $password === "") {
    recado_menu("Preenche nome e password", "error");
    redirecionar("../index.php");
}
if ($score < 0 || $time < 0 || $lives < 0) {
    recado_menu("Dados invalidos", "error");
    redirecionar("../index.php");
}

$stmt = $mysql->prepare("SELECT id, nome, password_hash FROM a17132_users WHERE nome = ? LIMIT 1");
if (!$stmt) {
    responder_erro_bd("Erro na base de dados: (" . $mysql->errno . ") " . $mysql->error);
}
$stmt->bind_param("s", $nome);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    $stmt->close();
    recado_menu("Login invalido", "error");
    redirecionar("../index.php");
}

$stmt->bind_result($user_id, $player_name, $password_hash);
$stmt->fetch();
$stmt->close();

if (!password_verify($password, $password_hash)) {
    recado_menu("Login invalido", "error");
    redirecionar("../index.php");
}

$user_id = (int)$user_id;
$player_name = (string)$player_name;

$stmt = $mysql->prepare("INSERT INTO a17132_stats (user_id, player_name, score, time_elapsed, lives_lost) VALUES (?, ?, ?, ?, ?)");
if (!$stmt) {
    responder_erro_bd("Erro na base de dados: (" . $mysql->errno . ") " . $mysql->error);
}
$stmt->bind_param("isiii", $user_id, $player_name, $score, $time, $lives);
$ok = $stmt->execute();
$stmt->close();

if (!$ok) {
    recado_menu("Erro ao guardar", "error");
    redirecionar("../index.php");
}

recado_menu("Estatisticas guardadas com sucesso", "success");
redirecionar("../index.php");
