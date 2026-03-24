<?php
session_start();

if (function_exists("mysqli_report")) {
    mysqli_report(MYSQLI_REPORT_OFF);
}

$bd_host = "localhost";
$bd_user = "usr21";
$bd_password = "dacic2020";
$bd_database = "usr21";

$mysql = null;
$db_error = "";

if (!class_exists("mysqli")) {
    $db_error = "Erro de base de dados: mysqli não está ativo no PHP.";
} else {
    $mysql = @new mysqli($bd_host, $bd_user, $bd_password, $bd_database);

    if ($mysql->connect_error) {
        $db_error = "Erro de base de dados: (" . $mysql->connect_errno . ") " . $mysql->connect_error;
    } else {
        $mysql->set_charset("utf8mb4");

        if (!$mysql->query("CREATE TABLE IF NOT EXISTS `a17132_users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `nome` VARCHAR(40) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
            $db_error = "Erro ao criar a tabela de utilizadores: (" . $mysql->errno . ") " . $mysql->error;
        } else if (!$mysql->query("CREATE TABLE IF NOT EXISTS `a17132_stats` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NULL,
            `player_name` VARCHAR(40) NOT NULL,
            `score` INT NOT NULL,
            `time_elapsed` INT NOT NULL,
            `lives_lost` INT NOT NULL,
            `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (`score`),
            INDEX (`criado_em`),
            CONSTRAINT `fk_a17132_stats_user` FOREIGN KEY (`user_id`) REFERENCES `a17132_users`(`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
            $db_error = "Erro ao criar a tabela de estatísticas: (" . $mysql->errno . ") " . $mysql->error;
        }
    }
}
