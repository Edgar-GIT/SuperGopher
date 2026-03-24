<?php
require __DIR__ . "/main.php";
require __DIR__ . "/helpers.php";

if (!isset($_SESSION["admin"]) || $_SESSION["admin"] !== true) {
    header("Location: ../index.php");
    exit;
}

$msg = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $action = $_POST["action"] ?? "";

    if ($action === "logout") {
        unset($_SESSION["admin"]);
        header("Location: ../index.php");
        exit;
    }
}

if ($db_error === "" && $_SERVER["REQUEST_METHOD"] === "POST") {
    $action = $_POST["action"] ?? "";

    if ($action === "update_user") {
        $id = intval($_POST["user_id"] ?? 0);
        $nome = limpar_nome($_POST["nome"] ?? "");
        $pass = $_POST["password"] ?? "";

        if ($id <= 0 || !validar_nome($nome)) {
            $msg = "Dados do utilizador inválidos";
        } else {
            $stmt = $mysql->prepare("SELECT id FROM a17132_users WHERE nome = ? AND id <> ? LIMIT 1");
            if (!$stmt) {
                $msg = "Erro de base de dados: (" . $mysql->errno . ") " . $mysql->error;
            } else {
                $stmt->bind_param("si", $nome, $id);
                $stmt->execute();
                $stmt->store_result();
                $exists = $stmt->num_rows > 0;
                $stmt->close();

                if ($exists) {
                    $msg = "Esse nome já existe";
                } else {
                    $mysql->begin_transaction();

                    if ($pass !== "") {
                        $hash = password_hash($pass, PASSWORD_DEFAULT);
                        $stmt = $mysql->prepare("UPDATE a17132_users SET nome = ?, password_hash = ? WHERE id = ?");
                        if ($stmt) {
                            $stmt->bind_param("ssi", $nome, $hash, $id);
                        }
                    } else {
                        $stmt = $mysql->prepare("UPDATE a17132_users SET nome = ? WHERE id = ?");
                        if ($stmt) {
                            $stmt->bind_param("si", $nome, $id);
                        }
                    }

                    if (!$stmt) {
                        $mysql->rollback();
                        $msg = "Erro de base de dados: (" . $mysql->errno . ") " . $mysql->error;
                    } else {
                        $ok_user = $stmt->execute();
                        $stmt->close();

                        if (!$ok_user) {
                            $mysql->rollback();
                            $msg = "Erro ao atualizar utilizador";
                        } else {
                            $stmt = $mysql->prepare("UPDATE a17132_stats SET player_name = ? WHERE user_id = ?");
                            if (!$stmt) {
                                $mysql->rollback();
                                $msg = "Erro de base de dados: (" . $mysql->errno . ") " . $mysql->error;
                            } else {
                                $stmt->bind_param("si", $nome, $id);
                                $ok_stats = $stmt->execute();
                                $stmt->close();

                                if (!$ok_stats) {
                                    $mysql->rollback();
                                    $msg = "Erro ao atualizar registos do utilizador";
                                } else {
                                    $mysql->commit();
                                    $msg = "Utilizador atualizado";
                                }
                            }
                        }
                    }
                }
            }
        }
    } else if ($action === "delete_user") {
        $id = intval($_POST["user_id"] ?? 0);

        if ($id > 0) {
            $stmt = $mysql->prepare("DELETE FROM a17132_users WHERE id = ?");
            if (!$stmt) {
                $msg = "Erro de base de dados: (" . $mysql->errno . ") " . $mysql->error;
            } else {
                $stmt->bind_param("i", $id);
                if ($stmt->execute()) {
                    $msg = "Utilizador apagado";
                } else {
                    $msg = "Erro ao apagar utilizador";
                }
                $stmt->close();
            }
        }
    } else if ($action === "update_stat") {
        $id = intval($_POST["stat_id"] ?? 0);
        $score = intval($_POST["score"] ?? -1);
        $time = intval($_POST["time_elapsed"] ?? -1);
        $lives = intval($_POST["lives_lost"] ?? -1);

        if ($id <= 0 || $score < 0 || $time < 0 || $lives < 0) {
            $msg = "Dados do registo inválidos";
        } else {
            $stmt = $mysql->prepare("UPDATE a17132_stats SET score = ?, time_elapsed = ?, lives_lost = ? WHERE id = ?");
            if (!$stmt) {
                $msg = "Erro de base de dados: (" . $mysql->errno . ") " . $mysql->error;
            } else {
                $stmt->bind_param("iiii", $score, $time, $lives, $id);
                if ($stmt->execute()) {
                    $msg = "Registo atualizado";
                } else {
                    $msg = "Erro ao atualizar registo";
                }
                $stmt->close();
            }
        }
    } else if ($action === "delete_stat") {
        $id = intval($_POST["stat_id"] ?? 0);

        if ($id > 0) {
            $stmt = $mysql->prepare("DELETE FROM a17132_stats WHERE id = ?");
            if (!$stmt) {
                $msg = "Erro de base de dados: (" . $mysql->errno . ") " . $mysql->error;
            } else {
                $stmt->bind_param("i", $id);
                if ($stmt->execute()) {
                    $msg = "Registo apagado";
                } else {
                    $msg = "Erro ao apagar registo";
                }
                $stmt->close();
            }
        }
    }
}

if ($db_error !== "") {
    $msg = $db_error;
}

$users = array();
$stats = array();

if ($db_error === "") {
    $res = $mysql->query("SELECT id, nome, criado_em FROM a17132_users ORDER BY id DESC");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $users[] = $row;
        }
        $res->close();
    }

    $res = $mysql->query("SELECT id, player_name, score, time_elapsed, lives_lost, criado_em FROM a17132_stats ORDER BY score DESC, time_elapsed ASC, criado_em DESC");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $stats[] = $row;
        }
        $res->close();
    }
}
?>
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Admin</title>
    <script src="../ArcadeUI.js?v=20260323e"></script>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #224f49, #3e6058);
            color: #163030;
        }
        .page {
            max-width: 1280px;
            margin: 0 auto;
            padding: 24px;
        }
        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        .title {
            color: #f3fffa;
            font-size: 32px;
            font-weight: 700;
        }
        .actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .btn {
            border: none;
            border-radius: 999px;
            padding: 10px 16px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .btn-menu {
            background: #f7ffc8;
            color: #2e4a1d;
        }
        .btn-logout {
            background: linear-gradient(180deg, #fff8cf, #f3d64f);
            border: 2px solid #d8a531;
            color: #5c3a21;
        }
        .panel {
            background: rgba(255, 255, 255, 0.96);
            border-radius: 16px;
            padding: 18px;
            margin-bottom: 18px;
            box-shadow: 0 16px 30px rgba(0, 0, 0, 0.18);
        }
        .panel h2 {
            margin: 0 0 14px;
            color: #224f49;
        }
        .msg {
            margin-bottom: 16px;
            padding: 12px 14px;
            border-radius: 10px;
            background: #e0f7ef;
            color: #1e4e42;
            font-weight: 700;
        }
        .search-panel {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .search-label {
            color: #224f49;
            font-size: 14px;
            font-weight: 700;
        }
        .search-help {
            color: #476a63;
            font-size: 13px;
        }
        .search-input {
            max-width: 520px;
        }
        .table-wrap {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 900px;
        }
        th, td {
            padding: 10px 8px;
            border-bottom: 1px solid #d7e3e0;
            text-align: left;
            vertical-align: middle;
        }
        th {
            color: #224f49;
            font-size: 14px;
        }
        td {
            color: #1d3733;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #c7d7d3;
            border-radius: 8px;
            box-sizing: border-box;
            background: #fffef7;
            color: #1d3733;
        }
        input:focus {
            outline: none;
            border-color: #d8a531;
            box-shadow: 0 0 0 3px rgba(216, 165, 49, 0.18);
        }
        .inline-form {
            display: grid;
            grid-template-columns: 1.3fr 1fr auto;
            gap: 8px;
            align-items: center;
        }
        .record-form {
            display: grid;
            grid-template-columns: 110px 110px 110px auto;
            gap: 8px;
            align-items: center;
        }
        .field-stack {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }
        .field-stack label {
            color: #224f49;
            font-size: 12px;
            font-weight: 700;
        }
        .btn-save {
            background: #3e8d79;
            color: #fff;
        }
        .btn-delete {
            background: #d94a4a;
            color: #fff;
        }
        .btn-small {
            padding: 8px 12px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="topbar">
            <div class="title">Painel Admin</div>
            <div class="actions">
                <a class="btn btn-menu" href="../index.php">Voltar ao Menu Principal</a>
                <form method="post">
                    <input type="hidden" name="action" value="logout">
                    <button class="btn btn-logout" type="submit">Sair</button>
                </form>
            </div>
        </div>

        <?php if ($msg !== "") { ?>
            <div class="msg"><?php echo htmlspecialchars($msg); ?></div>
        <?php } ?>

        <div class="panel search-panel">
            <h2>Pesquisar</h2>
            <label class="search-label" for="admin_search">Pesquisar utilizadores e registos</label>
            <input id="admin_search" class="search-input" type="text" placeholder="Escreve um nome, ID, score, tempo ou data">
            <div class="search-help">A pesquisa filtra ao mesmo tempo a tabela de utilizadores e a tabela de registos.</div>
        </div>

        <div class="panel">
            <h2>Utilizadores Registados</h2>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Criado em</th>
                            <th>Editar</th>
                            <th>Apagar</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $u) { ?>
                            <tr class="user-row">
                                <td><?php echo (int)$u["id"]; ?></td>
                                <td><?php echo htmlspecialchars($u["nome"]); ?></td>
                                <td><?php echo htmlspecialchars($u["criado_em"]); ?></td>
                                <td>
                                    <form class="inline-form" method="post">
                                        <input type="hidden" name="action" value="update_user">
                                        <input type="hidden" name="user_id" value="<?php echo (int)$u["id"]; ?>">
                                        <div class="field-stack">
                                            <label for="user_name_<?php echo (int)$u["id"]; ?>">Nome</label>
                                            <input id="user_name_<?php echo (int)$u["id"]; ?>" type="text" name="nome" value="<?php echo htmlspecialchars($u["nome"]); ?>" placeholder="Nome" aria-label="Nome do utilizador">
                                        </div>
                                        <div class="field-stack">
                                            <label for="user_password_<?php echo (int)$u["id"]; ?>">Nova password</label>
                                            <input id="user_password_<?php echo (int)$u["id"]; ?>" type="password" name="password" placeholder="Nova password" aria-label="Nova password">
                                        </div>
                                        <button class="btn btn-save btn-small" type="submit">Atualizar</button>
                                    </form>
                                </td>
                                <td>
                                    <form method="post">
                                        <input type="hidden" name="action" value="delete_user">
                                        <input type="hidden" name="user_id" value="<?php echo (int)$u["id"]; ?>">
                                        <button class="btn btn-delete btn-small" type="submit">Apagar</button>
                                    </form>
                                </td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="panel">
            <h2>Registos Guardados</h2>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Score</th>
                            <th>Tempo</th>
                            <th>Vidas Perdidas</th>
                            <th>Criado em</th>
                            <th>Editar</th>
                            <th>Apagar</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($stats as $s) { ?>
                            <tr class="stat-row">
                                <td><?php echo (int)$s["id"]; ?></td>
                                <td><?php echo htmlspecialchars($s["player_name"]); ?></td>
                                <td><?php echo (int)$s["score"]; ?></td>
                                <td><?php echo (int)$s["time_elapsed"]; ?> s</td>
                                <td><?php echo (int)$s["lives_lost"]; ?></td>
                                <td><?php echo htmlspecialchars($s["criado_em"]); ?></td>
                                <td>
                                    <form class="record-form" method="post">
                                        <input type="hidden" name="action" value="update_stat">
                                        <input type="hidden" name="stat_id" value="<?php echo (int)$s["id"]; ?>">
                                        <div class="field-stack">
                                            <label for="stat_score_<?php echo (int)$s["id"]; ?>">Pontuação</label>
                                            <input id="stat_score_<?php echo (int)$s["id"]; ?>" type="number" min="0" name="score" value="<?php echo (int)$s["score"]; ?>" placeholder="Pontos" aria-label="Pontuação">
                                        </div>
                                        <div class="field-stack">
                                            <label for="stat_time_<?php echo (int)$s["id"]; ?>">Tempo</label>
                                            <input id="stat_time_<?php echo (int)$s["id"]; ?>" type="number" min="0" name="time_elapsed" value="<?php echo (int)$s["time_elapsed"]; ?>" placeholder="Tempo" aria-label="Tempo">
                                        </div>
                                        <div class="field-stack">
                                            <label for="stat_lives_<?php echo (int)$s["id"]; ?>">Vidas Perdidas</label>
                                            <input id="stat_lives_<?php echo (int)$s["id"]; ?>" type="number" min="0" name="lives_lost" value="<?php echo (int)$s["lives_lost"]; ?>" placeholder="Vidas" aria-label="Vidas perdidas">
                                        </div>
                                        <button class="btn btn-save btn-small" type="submit">Atualizar</button>
                                    </form>
                                </td>
                                <td>
                                    <form method="post">
                                        <input type="hidden" name="action" value="delete_stat">
                                        <input type="hidden" name="stat_id" value="<?php echo (int)$s["id"]; ?>">
                                        <button class="btn btn-delete btn-small" type="submit">Apagar</button>
                                    </form>
                                </td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <script>
        window.addEventListener("load", function () {
            const searchInput = document.getElementById("admin_search");

            function FiltrarTabelasAdmin() {
                if (!searchInput) return;
                const termo = searchInput.value.trim().toLowerCase();
                document.querySelectorAll(".user-row, .stat-row").forEach(function (row) {
                    const corresponde = termo === "" || row.textContent.toLowerCase().includes(termo);
                    row.style.display = corresponde ? "" : "none";
                });
            }

            if (searchInput) {
                searchInput.addEventListener("input", FiltrarTabelasAdmin);
                FiltrarTabelasAdmin();
            }

            if (!window.ArcadeUI) return;

            window.ArcadeUI.setupLinearNavigation({
                getItems: function () {
                    return Array.from(document.querySelectorAll("a.btn, button.btn")).filter(function (item) {
                        return item && item.offsetParent !== null && !item.disabled;
                    });
                },
                onBack: function () {
                    const btn = document.querySelector(".btn-menu");
                    if (btn) btn.click();
                }
            });
        });
    </script>
</body>
</html>
