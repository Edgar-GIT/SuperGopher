<?php
require __DIR__ . "/db/main.php";
require __DIR__ . "/db/helpers.php";

$menu_msg = ler_recado("menu_msg", "");
$menu_msg_type = ler_recado("menu_msg_type", "error");
$admin_login_msg = ler_recado("admin_login_msg", "");
$open_admin_modal = ler_recado("open_admin_modal", "") === "1";

$stats = array();
$champion = null;

if ($db_error === "") {
    $res = $mysql->query("SELECT player_name, score, time_elapsed, lives_lost, criado_em FROM a17132_stats ORDER BY score DESC, time_elapsed ASC, criado_em DESC LIMIT 10");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $stats[] = $row;
        }
        $res->close();
    }

    $res = $mysql->query("SELECT player_name, score, time_elapsed, lives_lost, criado_em FROM a17132_stats ORDER BY score DESC, time_elapsed ASC, criado_em DESC LIMIT 1");
    if ($res) {
        $champion = $res->fetch_assoc();
        $res->close();
    }
}

function h($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, "UTF-8");
}

function formatar_tempo_menu($segundos) {
    $segundos = intval($segundos);
    $m = str_pad((string)floor($segundos / 60), 2, "0", STR_PAD_LEFT);
    $s = str_pad((string)($segundos % 60), 2, "0", STR_PAD_LEFT);
    return $m . ":" . $s;
}
?>
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menu Principal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="MainMenu.css">
    <script src="ArcadeUI.js?v=20260323e"></script>
    <script src="MainMenu.js"></script>
</head>
<body>
    <div id="admin_modal_overlay" class="admin-modal-overlay<?php echo $open_admin_modal ? " show" : ""; ?>">
        <div class="admin-modal" id="admin_modal">
            <div class="admin-modal-title">Acesso Admin</div>
            <div class="admin-modal-subtitle">Insere as credenciais de administrador</div>
            <form id="admin_login_form" class="admin-login-form" method="post" action="db/admin_login.php">
                <label class="admin-field-label" for="admin_user">Nome</label>
                <input id="admin_user" name="user" type="text" placeholder="Utilizador" autocomplete="username">
                <label class="admin-field-label" for="admin_password">Password</label>
                <input id="admin_password" name="password" type="password" placeholder="Password" autocomplete="current-password">
                <div id="admin_login_msg" class="admin-login-msg"><?php echo h($admin_login_msg); ?></div>
                <button type="submit" class="admin-submit-btn">Entrar</button>
            </form>
        </div>
    </div>

    <div class="container-fluid h-100 p-0">
        <div class="row h-100 g-2">
            <div class="col-lg-8 h-100 p-3">
                <div class="game-block" id="blocoGAME">
                    <button id="AdminButton" class="admin-button" type="button">Admin</button>
                    <?php if ($menu_msg !== "") { ?>
                        <div class="menu-flash menu-flash-<?php echo h($menu_msg_type); ?>"><?php echo h($menu_msg); ?></div>
                    <?php } ?>
                    <audio id="MainMenuMusic" src="./src/music/GameMenu.mp3" loop></audio>
                    <img id="mainMenuImage" src="./src/img/menu.jpg" alt="Menu Principal">

                    <div class="main-menu-buttons" id="mainMenuButtons">
                        <button id="Play" type="button" class="btn btn-primary" onclick="CleanStart()">Jogar</button>
                        <a id="Instructions" class="btn btn-info" href="instructions.html">Instruções</a>
                        <a id="Credits" class="btn btn-info" href="Credits.html">Créditos</a>
                    </div>
                </div>
            </div>
            <div class="col-lg-4 h-100 p-3">
                <div class="scores-table">
                    <div class="champion-section">
                        <div class="champion-title">Campeão Atual</div>
                        <div class="champion-box">
                            <table class="champion-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Pontuação</th>
                                        <th>Tempo</th>
                                        <th>Vidas Perdidas</th>
                                    </tr>
                                </thead>
                                <tbody id="champion-body">
                                    <?php if ($champion) { ?>
                                        <tr>
                                            <td><?php echo h($champion["player_name"] ?: "Guest"); ?></td>
                                            <td><?php echo intval($champion["score"]); ?></td>
                                            <td><?php echo h(formatar_tempo_menu($champion["time_elapsed"])); ?></td>
                                            <td><?php echo intval($champion["lives_lost"]); ?></td>
                                        </tr>
                                    <?php } else { ?>
                                        <tr>
                                            <td colspan="4" class="score-empty"><?php echo h($db_error !== "" ? $db_error : "Sem campeão por enquanto."); ?></td>
                                        </tr>
                                    <?php } ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="ranking-section">
                        <div class="scores-title">Estatísticas do Jogo</div>
                        <div class="game-score">
                            <table class="score-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Pontuação Total</th>
                                        <th>Tempo</th>
                                        <th>Vidas Perdidas</th>
                                    </tr>
                                </thead>
                                <tbody id="stats-body">
                                    <?php if ($stats) { ?>
                                        <?php foreach ($stats as $item) { ?>
                                            <tr>
                                                <td><?php echo h($item["player_name"] ?: "Guest"); ?></td>
                                                <td><?php echo intval($item["score"]); ?></td>
                                                <td><?php echo h(formatar_tempo_menu($item["time_elapsed"])); ?></td>
                                                <td><?php echo intval($item["lives_lost"]); ?></td>
                                            </tr>
                                        <?php } ?>
                                    <?php } else { ?>
                                        <tr>
                                            <td colspan="4" class="score-empty"><?php echo h($db_error !== "" ? $db_error : "Ainda não há registos guardados."); ?></td>
                                        </tr>
                                    <?php } ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
