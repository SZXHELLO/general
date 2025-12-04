// API配置 - 使用相对路径
const API_BASE_URL = 'http://localhost:8080';
let currentToken = null;
let currentUser = null;

// 游戏常量 - 增加塔相关常量
const GRID_SIZE = 25;
const TILE_SIZE = 24;
const PLAYER_COLORS = ['#ff7e5f', '#4a90e2', '#2ecc71'];
const NEUTRAL_COLOR = '#34495e';
const MOUNTAIN_COLOR = '#7f8c8d';
const TOWER_COLOR = '#9b59b6'; // 塔的颜色
const FOG_COLOR = '#2c3e50';
const ARMY_GROWTH_INTERVAL = 2000;
const TOWER_INITIAL_ARMY = 15; // 塔的初始兵力

// 游戏状态 - 修改胜利条件
let gameState = {
    grid: [],
    players: [
        { id: 0, name: '你', color: PLAYER_COLORS[0], territory: 5, army: 25, general: {x: 2, y: 2}, alive: true },
        { id: 1, name: '蓝色玩家', color: PLAYER_COLORS[1], territory: 5, army: 25, general: {x: GRID_SIZE-3, y: 2}, alive: true },
        { id: 2, name: '绿色玩家', color: PLAYER_COLORS[2], territory: 5, army: 25, general: {x: Math.floor(GRID_SIZE/2), y: GRID_SIZE-3}, alive: true }
    ],
    selectedTile: null,
    gameOver: false,
    playerVision: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false)),
    gameTimer: null,
    autoPlay: false,
    lastAIMove: 0,
    aiMoveInterval: 300,
    moveCount: 0,  // 新增：操作计数器
    gameStartTime: null,  // 新增：游戏开始时间
    gameEndTime: null     // 新增：游戏结束时间
};

// ================ 排行榜相关变量 ================
let leaderboardData = {
    fastest: [],
    territory: [],
    towers: []
};
let currentLeaderboardType = 'fastest';
let leaderboardInterval = null;

// 消息显示函数
function showMessage(message, type) {
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');

    hideMessages();

    if (type === 'error') {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

// 服务器状态检查
async function checkServerStatus() {
    try {
        console.log('检查服务器状态...');
        const response = await fetch(`${API_BASE_URL}/api/health`);

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const data = await response.json();
        console.log('服务器状态正常:', data);

        const statusElement = document.getElementById('serverStatus');
        const statusDot = statusElement.querySelector('.status-dot');
        statusDot.classList.add('connected');
        statusElement.innerHTML = '<span class="status-dot connected"></span> 服务器连接正常';

        return true;
    } catch (error) {
        console.error('服务器连接失败:', error);
        const statusElement = document.getElementById('serverStatus');
        statusElement.innerHTML = '<span class="status-dot"></span> 服务器连接失败';
        showMessage('无法连接到服务器，请确保Java后端正在运行', 'error');
        return false;
    }
}

// 认证函数
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showLoginSuccess();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
        console.error('登录错误:', error);
    }
}

async function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('注册成功！请登录', 'success');
            document.getElementById('password').value = '';
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
        console.error('注册错误:', error);
    }
}

function showLoginSuccess() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser.username;
    initGame();
    initLeaderboard();  // 新增：初始化排行榜
}

function logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }

    stopLeaderboard();  // 新增：停止排行榜刷新

    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    hideMessages();
}

async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (data.success) {
                currentToken = token;
                currentUser = JSON.parse(user);
                showLoginSuccess();
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('验证令牌失败:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
}

// 游戏核心函数
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // 清除之前的游戏计时器
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }

    // 重置游戏状态
    gameState.grid = [];
    gameState.selectedTile = null;
    gameState.gameOver = false;
    gameState.autoPlay = false;
    gameState.lastAIMove = 0;
    gameState.moveCount = 0;  // 重置操作计数器
    gameState.playerVision = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false));
    gameState.gameStartTime = Date.now();  // 记录游戏开始时间
    gameState.gameEndTime = null;  // 重置结束时间

    // 重置玩家状态
    gameState.players.forEach(player => {
        player.territory = 5;
        player.army = 25;
        player.alive = true;
    });

    // 初始化网格
    for (let y = 0; y < GRID_SIZE; y++) {
        gameState.grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            gameState.grid[y][x] = {
                type: 'empty',
                owner: -1,
                army: 0
            };
        }
    }

    // 放置将军和初始领土
    gameState.players.forEach(player => {
        const {x, y} = player.general;
        gameState.grid[y][x] = {
            type: 'general',
            owner: player.id,
            army: 10
        };

        generatePlayerTerritory(player.id, x, y, 4);
    });

    // 生成山脉 - 增加到35个
    generateMountains(35);

    // 生成塔 - 新增功能
    generateTowers(8);

    // 更新视野和UI
    updatePlayerVision();
    drawGame(ctx);
    updateUI();

    // 设置事件监听器
    setupEventListeners();

    // 启动游戏循环
    gameState.gameTimer = setInterval(gameLoop, 100);
    setInterval(growArmies, ARMY_GROWTH_INTERVAL);
}

function setupEventListeners() {
    const canvas = document.getElementById('gameCanvas');
    const newGameBtn = document.getElementById('newGameBtn');
    const howToPlayBtn = document.getElementById('howToPlayBtn');
    const autoPlayBtn = document.getElementById('autoPlayBtn');

    // 移除旧的事件监听器
    canvas.removeEventListener('click', handleCanvasClick);
    newGameBtn.removeEventListener('click', initGame);
    howToPlayBtn.removeEventListener('click', showInstructions);
    autoPlayBtn.removeEventListener('click', toggleAutoPlay);
    document.removeEventListener('keydown', handleKeyDown);

    // 添加新的事件监听器
    canvas.addEventListener('click', handleCanvasClick);
    newGameBtn.addEventListener('click', initGame);
    howToPlayBtn.addEventListener('click', showInstructions);
    autoPlayBtn.addEventListener('click', toggleAutoPlay);
    document.addEventListener('keydown', handleKeyDown);
}

// 生成塔函数 - 新增
function generateTowers(count) {
    let towersPlaced = 0;
    const maxAttempts = count * 10;
    let attempts = 0;

    while (towersPlaced < count && attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);

        // 确保塔不会生成在玩家起始位置附近和山脉上
        const isNearPlayer = gameState.players.some(player => {
            const dx = Math.abs(x - player.general.x);
            const dy = Math.abs(y - player.general.y);
            return dx <= 3 && dy <= 3;
        });

        if (!isNearPlayer && gameState.grid[y][x].type === 'empty') {
            gameState.grid[y][x] = {
                type: 'tower',
                owner: -1,
                army: TOWER_INITIAL_ARMY,  // 塔有更高的初始兵力
                initialArmy: TOWER_INITIAL_ARMY // 记录初始兵力用于占领条件
            };
            towersPlaced++;
        }
    }
}

function generatePlayerTerritory(playerId, startX, startY, territorySize) {
    const directions = [
        {dx: 0, dy: -1}, {dx: 1, dy: 0},
        {dx: 0, dy: 1}, {dx: -1, dy: 0}
    ];

    let territoriesPlaced = 0;
    let queue = [{x: startX, y: startY}];
    let visited = new Set();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0 && territoriesPlaced < territorySize) {
        const current = queue.shift();

        if (Math.random() > 0.3 && (current.x !== startX || current.y !== startY)) {
            gameState.grid[current.y][current.x] = {
                type: 'territory',
                owner: playerId,
                army: Math.floor(Math.random() * 3) + 1
            };
            territoriesPlaced++;
        }

        // 随机打乱方向以避免模式化
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);

        for (const dir of shuffledDirections) {
            const newX = current.x + dir.dx;
            const newY = current.y + dir.dy;

            if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE &&
                !visited.has(`${newX},${newY}`) &&
                gameState.grid[newY][newX].type === 'empty') {

                visited.add(`${newX},${newY}`);
                queue.push({x: newX, y: newY});
            }
        }
    }
}

function generateMountains(count) {
    let mountainsPlaced = 0;
    const maxAttempts = count * 10;
    let attempts = 0;

    while (mountainsPlaced < count && attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);

        // 确保山脉不会生成在玩家起始位置附近
        const isNearPlayer = gameState.players.some(player => {
            const dx = Math.abs(x - player.general.x);
            const dy = Math.abs(y - player.general.y);
            return dx <= 2 && dy <= 2;
        });

        if (!isNearPlayer && gameState.grid[y][x].type === 'empty') {
            gameState.grid[y][x] = {
                type: 'mountain',
                owner: -1,
                army: 0
            };
            mountainsPlaced++;
        }
    }
}

function updatePlayerVision() {
    // 重置视野
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            gameState.playerVision[y][x] = false;
        }
    }

    // 玩家领土和相邻格子可见
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];

            if (tile.owner === 0) {
                gameState.playerVision[y][x] = true;

                // 显示相邻格子
                const directions = [
                    {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
                    {dx: -1, dy: 0},                   {dx: 1, dy: 0},
                    {dx: -1, dy: 1},  {dx: 0, dy: 1},  {dx: 1, dy: 1}
                ];

                for (const dir of directions) {
                    const newX = x + dir.dx;
                    const newY = y + dir.dy;

                    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                        gameState.playerVision[newY][newX] = true;
                    }
                }
            }
        }
    }

    // 山脉和塔始终可见
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameState.grid[y][x].type === 'mountain' || gameState.grid[y][x].type === 'tower') {
                gameState.playerVision[y][x] = true;
            }
        }
    }
}

function drawGame(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制背景
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;

            // 战争迷雾
            if (!gameState.playerVision[y][x]) {
                ctx.fillStyle = FOG_COLOR;
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

                // 迷雾纹理
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

                ctx.strokeStyle = '#1a1a2e';
                ctx.lineWidth = 1;
                ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
                continue;
            }

            // 确定格子颜色
            if (tile.type === 'mountain') {
                ctx.fillStyle = MOUNTAIN_COLOR;
            } else if (tile.type === 'tower') {
                ctx.fillStyle = TOWER_COLOR;
            } else if (tile.owner === -1) {
                ctx.fillStyle = NEUTRAL_COLOR;
            } else {
                ctx.fillStyle = PLAYER_COLORS[tile.owner];
            }

            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            // 格子边框
            ctx.strokeStyle = tile.owner === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            // 绘制将军（皇冠）
            if (tile.type === 'general') {
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👑', tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
            }

            // 绘制塔（城堡） - 新增
            if (tile.type === 'tower') {
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🏰', tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
            }

            // 绘制军队数量（如果可见）
            if (tile.army > 0 && gameState.playerVision[y][x]) {
                if (tile.owner === 0 || isAdjacentToPlayer(x, y)) {
                    ctx.fillStyle = tile.owner === 0 ? '#ffffff' : '#000000';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tile.army.toString(), tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
                }
            }

            // 绘制选中效果
            if (gameState.selectedTile && gameState.selectedTile.x === x && gameState.selectedTile.y === y) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(tileX + 1, tileY + 1, TILE_SIZE - 2, TILE_SIZE - 2);

                // 选中光晕效果
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(tileX - 1, tileY - 1, TILE_SIZE + 2, TILE_SIZE + 2);
            }
        }
    }
}

function isAdjacentToPlayer(x, y) {
    const directions = [
        {dx: 0, dy: -1}, {dx: 1, dy: 0},
        {dx: 0, dy: 1}, {dx: -1, dy: 0}
    ];

    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;

        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            if (gameState.grid[newY][newX].owner === 0) {
                return true;
            }
        }
    }

    return false;
}

function handleCanvasClick(event) {
    if (gameState.gameOver) return;

    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((event.clientX - rect.left) * scaleX / TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) * scaleY / TILE_SIZE);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const tile = gameState.grid[y][x];

    if (gameState.selectedTile) {
        // 尝试移动军队
        const selected = gameState.grid[gameState.selectedTile.y][gameState.selectedTile.x];
        const dx = Math.abs(x - gameState.selectedTile.x);
        const dy = Math.abs(y - gameState.selectedTile.y);
        const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

        if (isAdjacent && selected.army > 1 && tile.type !== 'mountain') {
            moveArmy(gameState.selectedTile.x, gameState.selectedTile.y, x, y);
            gameState.selectedTile = null;
        } else {
            // 选择新的格子
            if (tile.owner === 0 && tile.army > 1) {
                gameState.selectedTile = {x, y};
            } else {
                gameState.selectedTile = null;
            }
        }
    } else if (tile.owner === 0 && tile.army > 1) {
        // 选择格子
        gameState.selectedTile = {x, y};
    }

    updateUI();
}

function handleKeyDown(event) {
    if (gameState.gameOver || !gameState.selectedTile) return;

    const {x, y} = gameState.selectedTile;
    let newX = x;
    let newY = y;

    switch(event.key) {
        case 'ArrowUp': newY = y - 1; break;
        case 'ArrowDown': newY = y + 1; break;
        case 'ArrowLeft': newX = x - 1; break;
        case 'ArrowRight': newX = x + 1; break;
        case 'Escape': gameState.selectedTile = null; break;
        default: return;
    }

    event.preventDefault();

    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;

    const selected = gameState.grid[y][x];
    const targetTile = gameState.grid[newY][newX];

    if (selected.army > 1 && targetTile.type !== 'mountain') {
        moveArmy(x, y, newX, newY);
        gameState.selectedTile = {x: newX, y: newY};
    } else if (targetTile.owner === 0 && targetTile.army > 1) {
        gameState.selectedTile = {x: newX, y: newY};
    }

    updateUI();
}

function moveArmy(fromX, fromY, toX, toY) {
    // 增加操作计数
    gameState.moveCount = (gameState.moveCount || 0) + 1;

    const fromTile = gameState.grid[fromY][fromX];
    const toTile = gameState.grid[toY][toX];
    const movingArmy = fromTile.army - 1;

    if (toTile.owner === -1) {
        // 移动到空地或塔
        // 如果是塔，需要满足兵力条件才能占领
        if (toTile.type === 'tower') {
            if (movingArmy >= TOWER_INITIAL_ARMY) {
                // 满足兵力条件，可以占领塔
                toTile.owner = fromTile.owner;
                toTile.army = movingArmy;
                fromTile.army = 1;
            } else {
                // 不满足兵力条件，攻击失败
                toTile.army -= movingArmy;
                fromTile.army = 1;
                document.getElementById('gameStatus').innerHTML =
                    `<div class="status-text">兵力不足！需要至少${TOWER_INITIAL_ARMY}兵力才能占领塔</div>`;
                return; // 不继续执行
            }
        } else {
            // 普通空地
            toTile.owner = fromTile.owner;
            toTile.army = movingArmy;
            toTile.type = 'territory';
            fromTile.army = 1;
        }

    } else if (toTile.owner === fromTile.owner) {
        // 移动到自己的领地
        toTile.army += movingArmy;
        fromTile.army = 1;

    } else {
        // 攻击敌人
        if (movingArmy > toTile.army) {
            // 记录被击败的玩家ID（在改变所有权之前）
            const defeatedPlayerId = toTile.owner;

            // 攻击成功
            toTile.owner = fromTile.owner;
            toTile.army = movingArmy - toTile.army;
            fromTile.army = 1;

            // 检查是否占领了将军
            if (toTile.type === 'general') {
                // 标记该玩家死亡
                const defeatedPlayer = gameState.players[defeatedPlayerId];
                defeatedPlayer.alive = false;

                // 占领该玩家的所有土地，士兵数量减半
                conquerPlayerTerritories(defeatedPlayerId, fromTile.owner);

                // 检查是否所有敌人都被击败
                checkGameWinCondition();
            }
        } else {
            // 攻击失败
            toTile.army -= movingArmy;
            fromTile.army = 1;
        }
    }

    updatePlayerStats();
}

// 占领被击败玩家的所有土地
function conquerPlayerTerritories(defeatedPlayerId, conquerorId) {
    let conqueredCount = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];

            // 如果这块土地属于被击败的玩家，且不是塔
            if (tile.owner === defeatedPlayerId && tile.type !== 'tower') {
                // 改变所有者
                tile.owner = conquerorId;

                // 士兵数量减半（向下取整，至少为1）
                tile.army = Math.max(1, Math.floor(tile.army / 2));

                // 如果是将军，变成塔
                if (tile.type === 'general') {
                    tile.type = 'tower';
                    tile.army = TOWER_INITIAL_ARMY; // 设置为塔的初始兵力
                }

                conqueredCount++;
            }
        }
    }

    // 更新玩家统计
    updatePlayerStats();

    // 显示占领消息
    const defeatedPlayer = gameState.players[defeatedPlayerId];
    const conqueror = gameState.players[conquerorId];
    document.getElementById('gameStatus').innerHTML =
        `<div class="status-text">已击败 ${defeatedPlayer.name}！占领了 ${conqueredCount} 块领土！</div>`;

    console.log(`征服了玩家 ${defeatedPlayerId} 的 ${conqueredCount} 块领土`);
}

// 检查游戏胜利条件
function checkGameWinCondition() {
    const aliveEnemies = gameState.players.filter((player, index) => index !== 0 && player.alive);

    if (aliveEnemies.length === 0) {
        gameState.gameOver = true;
        gameState.gameEndTime = Date.now();  // 记录游戏结束时间

        const winner = gameState.players[0];

        // ================ 计算游戏耗时（秒） ================
        const gameDuration = Math.max(0, Math.floor((gameState.gameEndTime - gameState.gameStartTime) / 1000));

        const gameData = {
            won: true,
            territory: winner.territory,
            army: winner.army,
            towers: countPlayerTowers(0), // 计算玩家占领的塔数
            enemiesDefeated: gameState.players.length - 1,
            movesCount: gameState.moveCount || 0,
            gameTime: gameDuration  // 新增：游戏耗时（秒）
        };

        // 异步保存游戏记录
        setTimeout(() => {
            saveGameRecord(gameData);
        }, 500);
        // ================ 新增结束 ================

        document.getElementById('gameStatus').innerHTML =
            `<div class="winning-message">🎉 游戏结束！${winner.name} 获胜！用时: ${formatTime(gameDuration)}</div>`;

        if (gameState.gameTimer) {
            clearInterval(gameState.gameTimer);
        }

        // 延迟显示胜利窗口，让玩家看到最终状态
        setTimeout(() => {
            showVictoryModal(gameDuration);
        }, 1000);
    } else {
        // 只是击败了一个玩家，游戏继续
        const defeatedPlayers = gameState.players.filter((player, index) => index !== 0 && !player.alive);
        document.getElementById('gameStatus').innerHTML =
            `<div class="status-text">已击败 ${defeatedPlayers.length}个敌人！继续攻击剩余敌人！</div>`;
    }
}

// 显示胜利模态窗口
function showVictoryModal(gameDuration) {
    // 创建模态窗口
    const modal = document.createElement('div');
    modal.id = 'victoryModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '2000';

    // 创建内容区域
    const content = document.createElement('div');
    content.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
    content.style.padding = '40px';
    content.style.borderRadius = '20px';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.6)';
    content.style.border = '2px solid rgba(255, 126, 95, 0.3)';
    content.style.maxWidth = '500px';
    content.style.width = '90%';

    // 创建标题
    const title = document.createElement('h2');
    title.textContent = '🎉 恭喜获胜！ 🎉';
    title.style.color = '#ff7e5f';
    title.style.fontSize = '2.5rem';
    title.style.marginBottom = '20px';
    title.style.background = 'linear-gradient(90deg, #ff7e5f, #feb47b)';
    title.style.webkitBackgroundClip = 'text';
    title.style.backgroundClip = 'text';
    title.style.color = 'transparent';

    // 创建统计信息
    const stats = document.createElement('div');
    stats.style.marginBottom = '30px';
    stats.style.color = '#e6e6e6';

    const territoryStat = document.createElement('p');
    territoryStat.textContent = `最终领土: ${gameState.players[0].territory}`;
    territoryStat.style.fontSize = '1.2rem';
    territoryStat.style.margin = '10px 0';

    const armyStat = document.createElement('p');
    armyStat.textContent = `最终军队: ${gameState.players[0].army}`;
    armyStat.style.fontSize = '1.2rem';
    armyStat.style.margin = '10px 0';

    const timeStat = document.createElement('p');
    timeStat.textContent = `游戏用时: ${formatTime(gameDuration)}`;
    timeStat.style.fontSize = '1.2rem';
    timeStat.style.margin = '10px 0';
    timeStat.style.color = '#feb47b';
    timeStat.style.fontWeight = '600';

    const movesStat = document.createElement('p');
    movesStat.textContent = `操作次数: ${gameState.moveCount || 0}`;
    movesStat.style.fontSize = '1.1rem';
    movesStat.style.margin = '10px 0';
    movesStat.style.color = '#a0a0a0';

    stats.appendChild(territoryStat);
    stats.appendChild(armyStat);
    stats.appendChild(timeStat);
    stats.appendChild(movesStat);

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.alignItems = 'center';

    // 创建下一局按钮
    const nextGameButton = document.createElement('button');
    nextGameButton.textContent = '开始下一局';
    nextGameButton.style.background = 'linear-gradient(135deg, #ff7e5f, #feb47b)';
    nextGameButton.style.color = 'white';
    nextGameButton.style.border = 'none';
    nextGameButton.style.padding = '15px 30px';
    nextGameButton.style.borderRadius = '10px';
    nextGameButton.style.fontSize = '1.2rem';
    nextGameButton.style.cursor = 'pointer';
    nextGameButton.style.fontWeight = '600';
    nextGameButton.style.transition = 'all 0.3s ease';
    nextGameButton.style.width = '200px';

    nextGameButton.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 20px rgba(255, 126, 95, 0.4)';
    };

    nextGameButton.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    };

    nextGameButton.onclick = function() {
        document.body.removeChild(modal);
        initGame();
    };

    // 创建返回主菜单按钮
    const menuButton = document.createElement('button');
    menuButton.textContent = '返回主菜单';
    menuButton.style.background = 'rgba(45, 64, 89, 0.8)';
    menuButton.style.color = '#e6e6e6';
    menuButton.style.border = '2px solid #2d4059';
    menuButton.style.padding = '12px 24px';
    menuButton.style.borderRadius = '10px';
    menuButton.style.fontSize = '1.1rem';
    menuButton.style.cursor = 'pointer';
    menuButton.style.fontWeight = '600';
    menuButton.style.transition = 'all 0.3s ease';
    menuButton.style.width = '200px';

    menuButton.onmouseover = function() {
        this.style.borderColor = '#ff7e5f';
        this.style.transform = 'translateY(-2px)';
    };

    menuButton.onmouseout = function() {
        this.style.transform = 'translateY(0)';
    };

    menuButton.onclick = function() {
        document.body.removeChild(modal);
        logout();
    };

    // 组装所有元素
    buttonContainer.appendChild(nextGameButton);
    buttonContainer.appendChild(menuButton);

    content.appendChild(title);
    content.appendChild(stats);
    content.appendChild(buttonContainer);

    modal.appendChild(content);

    // 添加到页面
    document.body.appendChild(modal);
}

function growArmies() {
    if (gameState.gameOver) return;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];
            if (tile.owner !== -1 && tile.type !== 'mountain') {
                // 塔每回合增长2兵力，其他增长1兵力
                const growth = tile.type === 'tower' ? 2 : 1;
                tile.army += growth;
            }
        }
    }

    updatePlayerStats();
}

function gameLoop() {
    const currentTime = Date.now();

    // AI移动 - 无论是否自动演示模式，AI都会移动
    if (!gameState.gameOver && currentTime - gameState.lastAIMove > gameState.aiMoveInterval) {
        executeAITurn();
        gameState.lastAIMove = currentTime;
    }

    updatePlayerVision();
    const ctx = document.getElementById('gameCanvas').getContext('2d');
    drawGame(ctx);
    updateUI();
}

function executeAITurn() {
    for (let i = 1; i < gameState.players.length; i++) {
        const aiPlayer = gameState.players[i];
        if (!aiPlayer.alive) continue; // 跳过已死亡的AI玩家

        // 收集所有可移动的领土
        const movableTerritories = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = gameState.grid[y][x];
                if (tile.owner === aiPlayer.id && tile.army > 1) {
                    movableTerritories.push({x, y, army: tile.army});
                }
            }
        }

        if (movableTerritories.length === 0) continue;

        // 按军队数量排序，优先使用兵力多的领土
        movableTerritories.sort((a, b) => b.army - a.army);

        // 尝试为每个可移动领土找到最佳移动
        for (const territory of movableTerritories) {
            const bestMove = findBestMove(territory.x, territory.y, aiPlayer.id);

            if (bestMove) {
                // 执行最佳移动
                moveArmy(territory.x, territory.y, bestMove.x, bestMove.y);
                break; // 每回合每个AI玩家只执行一次最佳移动
            }
        }
    }
}

function findBestMove(x, y, playerId) {
    const directions = [
        {dx: 0, dy: -1}, {dx: 1, dy: 0},
        {dx: 0, dy: 1}, {dx: -1, dy: 0}
    ];

    const fromTile = gameState.grid[y][x];
    const movingArmy = fromTile.army - 1;
    let bestMove = null;
    let bestScore = -Infinity;

    for (const dir of directions) {
        const toX = x + dir.dx;
        const toY = y + dir.dy;

        // 检查边界和山脉
        if (toX < 0 || toX >= GRID_SIZE || toY < 0 || toY >= GRID_SIZE) continue;
        if (gameState.grid[toY][toX].type === 'mountain') continue;

        const toTile = gameState.grid[toY][toX];
        let score = 0;

        // 攻击敌方将军 - 最高优先级
        if (toTile.type === 'general' && toTile.owner !== playerId && toTile.owner !== -1) {
            if (movingArmy > toTile.army) {
                score = 1000; // 能获胜的攻击
            } else {
                score = 100; // 即使不能获胜也要尝试
            }
        }
        // 占领塔 - 高优先级，但需要满足兵力条件
        else if (toTile.type === 'tower' && toTile.owner !== playerId) {
            if (movingArmy >= TOWER_INITIAL_ARMY && movingArmy > toTile.army) {
                score = 80 + (movingArmy - toTile.army) * 3;
            } else {
                score = 10; // 低优先级，因为可能无法占领
            }
        }
        // 攻击敌人 - 高优先级
        else if (toTile.owner !== -1 && toTile.owner !== playerId) {
            if (movingArmy > toTile.army) {
                // 能获胜的攻击
                score = 50 + (movingArmy - toTile.army) * 5;
            } else if (movingArmy === toTile.army) {
                // 平局攻击
                score = 20;
            } else {
                // 劣势攻击 - 低优先级
                score = Math.max(5, movingArmy - toTile.army + 10);
            }
        }
        // 扩张到空地 - 中等优先级
        else if (toTile.owner === -1) {
            score = 25;
        }
        // 合并到自己的领土 - 低优先级，但有时有用
        else if (toTile.owner === playerId) {
            score = 5;
        }

        // 添加随机因素使AI行为更不可预测
        score += Math.random() * 10;

        if (score > bestScore) {
            bestScore = score;
            bestMove = {x: toX, y: toY, score};
        }
    }

    // 只返回得分足够高的移动
    return bestScore > 10 ? bestMove : null;
}

function updatePlayerStats() {
    // 重置统计数据
    gameState.players.forEach(player => {
        player.territory = 0;
        player.army = 0;
    });

    // 计算统计数据
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];
            if (tile.owner !== -1 && tile.type !== 'mountain') {
                gameState.players[tile.owner].territory++;
                gameState.players[tile.owner].army += tile.army;
            }
        }
    }
}

function updateUI() {
    // 更新玩家统计
    document.getElementById('playerTerritory').textContent = gameState.players[0].territory;
    document.getElementById('playerArmy').textContent = gameState.players[0].army;

    // 更新敌人统计（如果可见）
    for (let i = 1; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        const canSee = canSeePlayerInfo(i);

        const territoryElement = document.getElementById(i === 1 ? 'blueTerritory' : 'greenTerritory');
        const armyElement = document.getElementById(i === 1 ? 'blueArmy' : 'greenArmy');

        if (canSee) {
            if (player.alive) {
                territoryElement.textContent = player.territory;
                armyElement.textContent = player.army;
            } else {
                territoryElement.textContent = '已击败';
                armyElement.textContent = '已击败';
            }
        } else {
            territoryElement.textContent = '?';
            armyElement.textContent = '?';
        }
    }

    // 更新选中信息
    const selectedInfo = document.getElementById('selectedInfo');
    if (gameState.selectedTile) {
        const tile = gameState.grid[gameState.selectedTile.y][gameState.selectedTile.x];
        let tileType = '';
        if (tile.type === 'general') tileType = '将军';
        else if (tile.type === 'tower') tileType = '塔';
        else if (tile.type === 'territory') tileType = '领土';

        selectedInfo.textContent = `选中: 位置(${gameState.selectedTile.x},${gameState.selectedTile.y}) ${tileType} 兵力: ${tile.army}`;
    } else {
        selectedInfo.textContent = '';
    }

    // 更新游戏状态
    const statusElement = document.getElementById('gameStatus').querySelector('.status-text');
    if (gameState.gameOver) {
        statusElement.textContent = '游戏结束 - 你赢了！';
    } else if (gameState.selectedTile) {
        statusElement.textContent = '已选中军队 - 点击相邻格子移动';
    } else {
        // 显示剩余敌人数量
        const aliveEnemies = gameState.players.filter((player, index) => index !== 0 && player.alive).length;
        statusElement.textContent = `选择你的领地开始移动 - 剩余敌人: ${aliveEnemies}`;
    }
}

function canSeePlayerInfo(playerId) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameState.grid[y][x].owner === playerId && isAdjacentToPlayer(x, y)) {
                return true;
            }
        }
    }
    return false;
}

function toggleAutoPlay() {
    gameState.autoPlay = !gameState.autoPlay;
    const button = document.getElementById('autoPlayBtn');
    button.textContent = gameState.autoPlay ? '停止演示' : '自动演示';
    button.style.background = gameState.autoPlay ?
        'linear-gradient(135deg, #e74c3c, #c0392b)' :
        'linear-gradient(135deg, #ff7e5f, #feb47b)';
}

function showInstructions() {
    const instructions = `
Generals.io 游戏规则：

🎯 目标：
  占领所有敌方将军（👑）来获得胜利！

⚔️ 移动规则：
  • 点击你的领地选择军队（兵力必须 > 1）
  • 点击相邻的格子进行移动
  • 使用方向键移动选中的军队

🏰 移动类型：
  • 移动到自己的领地：源格子保留1兵力，目标格子获得总兵力-1
  • 移动到空地：占领该格子，源格子保留1兵力
  • 移动到敌人领地：进行战斗，兵力多者获胜

🏯 塔的特殊规则：
  • 塔（🏰）有更高的初始兵力（15）
  • 需要至少15兵力才能占领塔
  • 占领塔后，每回合增长2兵力（普通领地增长1）
  • 塔提供战略优势，优先占领！

📈 军队增长：
  • 普通领地每2秒军队数量+1
  • 塔每2秒军队数量+2

🕵️ 战争迷雾：
  • 只有你的领土和相邻格子可见
  • 只有相邻的敌人领地才显示军队数量

⛰️ 地形：
  • 山脉无法通过
  • 增加了更多山脉作为障碍

💡 提示：
  • 优先保护你的将军
  • 占领塔以获得兵力优势
  • 需要击败所有敌人才能获胜
  • 集中兵力攻击敌人弱点
    `;

    alert(instructions);
}

// ================ 排行榜相关函数 ================

// 切换排行榜显示
function showLeaderboard(type) {
    currentLeaderboardType = type;

    // 检查排行榜元素是否存在
    const leaderboardContent = document.getElementById('leaderboardContent');
    if (!leaderboardContent) {
        console.log('排行榜内容元素不存在，无法切换');
        return;
    }

    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });

    // 更新排行榜显示
    updateLeaderboardDisplay();

    // 刷新数据
    fetchLeaderboard(type);
}

// 获取排行榜标题
function getLeaderboardTitle(type) {
    const titles = {
        'fastest': '🏃 速攻榜',
        'territory': '🗺️ 领土榜',
        'towers': '🏰 塔王榜'
    };
    return titles[type] || '排行榜';
}

// 更新排行榜显示
function updateLeaderboardDisplay() {
    const contentElement = document.getElementById('leaderboardContent');

    if (!contentElement) {
        console.log('排行榜内容元素不存在');
        return;
    }

    const data = leaderboardData[currentLeaderboardType];

    if (!data || data.length === 0) {
        console.log(`${currentLeaderboardType}排行榜数据为空`);
        contentElement.innerHTML = '<div class="no-data">暂无数据</div>';
        return;
    }

    // 调试：查看数据结构
    console.log(`${currentLeaderboardType}排行榜第一个项目数据:`, data[0]);

    let html = '<div class="leaderboard-list">';

    data.forEach((item, index) => {
        const rank = index + 1;
        const rankClass = getRankClass(rank);

        // 显示信息取决于排行榜类型
        let displayText = '';
        let timeInfo = '';

        if (currentLeaderboardType === 'fastest') {
            // 速攻榜：item.value 是游戏时间（秒）
            displayText = `⏱️ ${formatTime(item.value)}`;
            // 显示记录创建时间
            if (item.createdAt) {
                timeInfo = formatGameTime(item.createdAt);
            }
        } else if (currentLeaderboardType === 'territory') {
            // 领土榜：item.value 是领土数
            displayText = `🗺️ ${item.value} 领土`;
            if (item.createdAt) {
                timeInfo = formatGameTime(item.createdAt);
            }
        } else if (currentLeaderboardType === 'towers') {
            // 塔王榜：item.value 是塔数
            displayText = `🏰 ${item.value} 座塔`;
            if (item.createdAt) {
                timeInfo = formatGameTime(item.createdAt);
            }
        }

        html += `
            <div class="leaderboard-item">
                <div class="rank-badge ${rankClass}">${rank}</div>
                <div class="player-info">
                    <div class="player-name">${item.username}</div>
                    <div class="player-stats">
                        ${displayText}${timeInfo ? ` • ${timeInfo}` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    contentElement.innerHTML = html;
}

// 获取排名样式类
function getRankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
}

// 格式化排行榜数值
function formatLeaderboardValue(type, value) {
    switch(type) {
        case 'fastest':
            return `⏱️ ${formatTime(value)}`;
        case 'territory':
            return `🗺️ ${value} 领土`;
        case 'towers':
            return `🏰 ${value} 座塔`;
        default:
            return value;
    }
}

// 格式化时间（秒转分:秒）
// 修复的 formatTime 函数
function formatTime(seconds) {
    // 处理各种边界情况
    if (seconds === null || seconds === undefined || seconds === '') {
        return '0:00';
    }

    seconds = Number(seconds);

    // 确保是有效的数字
    if (isNaN(seconds) || seconds < 0) {
        return '0:00';
    }

    // 处理0秒的情况
    if (seconds === 0) {
        return '0:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 格式化游戏时间
function formatGameTime(dateTime) {
    if (!dateTime) return '';

    try {
        const date = new Date(dateTime);

        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            return '';
        }

        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (isNaN(diffHours)) {
            return '';
        }

        if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else {
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}天前`;
        }
    } catch (error) {
        console.log('时间格式化出错:', dateTime);
        return '';
    }
}

// 获取排行榜数据
async function fetchLeaderboard(type, limit = 10) {
    try {
        let url;
        switch(type) {
            case 'fastest':
                url = `${API_BASE_URL}/api/stats/fastest?limit=${limit}`;
                break;
            case 'territory':
                url = `${API_BASE_URL}/api/stats/territory?limit=${limit}`;
                break;
            case 'towers':
                url = `${API_BASE_URL}/api/stats/towers?limit=${limit}`;
                break;
            default:
                return;
        }

        console.log(`正在获取${type}排行榜:`, url);
        const response = await fetch(url);
        const data = await response.json();

        console.log(`${type}排行榜返回数据:`, {
            success: data.success,
            dataCount: data.data ? data.data.length : 0,
            sampleData: data.data && data.data.length > 0 ? data.data[0] : '无数据'
        });

        if (data.success) {
            leaderboardData[type] = data.data;

            // 如果当前显示的是这个类型，立即更新显示
            if (currentLeaderboardType === type) {
                updateLeaderboardDisplay();
            }
        } else {
            console.log(`${type}排行榜请求失败:`, data.message);
        }
    } catch (error) {
        console.error(`获取${type}排行榜失败:`, error);
    }
}

// 获取所有排行榜数据
async function fetchAllLeaderboards() {
    await Promise.all([
        fetchLeaderboard('fastest'),
        fetchLeaderboard('territory'),
        fetchLeaderboard('towers')
    ]);
}

// 计算玩家占领的塔数
function countPlayerTowers(playerId) {
    let towerCount = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];
            if (tile.type === 'tower' && tile.owner === playerId) {
                towerCount++;
            }
        }
    }
    return towerCount;
}

// 保存游戏记录
async function saveGameRecord(gameData) {
    if (!currentToken || !currentUser) {
        console.log('用户未登录，不保存游戏记录');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/stats/record`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentUser.id,
                won: gameData.won,
                territory: gameData.territory,
                army: gameData.army,
                towers: gameData.towers,
                enemiesDefeated: gameData.enemiesDefeated,
                movesCount: gameData.movesCount,
                gameTime: gameData.gameTime  // 新增：发送游戏时间
            })
        });

        const data = await response.json();
        if (data.success) {
            console.log('游戏记录保存成功，用时:', gameData.gameTime, '秒');
            // 游戏记录保存后，刷新排行榜
            setTimeout(fetchAllLeaderboards, 1000);
        }
    } catch (error) {
        console.error('保存游戏记录失败:', error);
    }
}

// 初始化排行榜
function initLeaderboard() {
    console.log('初始化排行榜...');

    // 检查排行榜元素是否存在
    const leaderboardElement = document.getElementById('leaderboardContent');
    if (!leaderboardElement) {
        console.log('排行榜元素不存在，等待DOM加载...');
        // 稍后重试
        setTimeout(initLeaderboard, 500);
        return;
    }

    console.log('排行榜元素已找到，开始初始化');

    // 首次显示默认排行榜
    showLeaderboard('fastest');

    // 首次加载数据
    fetchAllLeaderboards();

    // 设置定时刷新（每30秒刷新一次）
    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
    }
    leaderboardInterval = setInterval(fetchAllLeaderboards, 30000);
}

// 停止排行榜刷新
function stopLeaderboard() {
    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
        leaderboardInterval = null;
    }
}

// 页面加载初始化
window.onload = function() {
    console.log('页面加载完成，开始检查服务器状态...');
    checkServerStatus();
    checkLoginStatus();

    // 添加回车键支持
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    // 每30秒检查一次服务器状态
    setInterval(checkServerStatus, 30000);
};