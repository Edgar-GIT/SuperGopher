<?php
require __DIR__ . "/main.php";
require __DIR__ . "/helpers.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    redirecionar("../index.php");
}

if ($db_error !== "") {
    responder_erro_bd($db_error);
}

$score = intval($_POST["score"] ?? -1);
$time = intval($_POST["time"] ?? -1);
$lives = intval($_POST["lives_lost"] ?? -1);

if ($score < 0 || $time < 0 || $lives < 0) {
    recado_menu("Dados invalidos", "error");
    redirecionar("../index.php");
}

$player_name = "Guest";
$stmt = $mysql->prepare("INSERT INTO a17132_stats (player_name, score, time_elapsed, lives_lost) VALUES (?, ?, ?, ?)");
if (!$stmt) {
    responder_erro_bd("Erro na base de dados: (" . $mysql->errno . ") " . $mysql->error);
}
$stmt->bind_param("siii", $player_name, $score, $time, $lives);
$ok = $stmt->execute();
$stmt->close();

if (!$ok) {
    recado_menu("Erro ao guardar", "error");
    redirecionar("../index.php");
}

recado_menu("Estatisticas guardadas como Guest", "success");
redirecionar("../index.php");
