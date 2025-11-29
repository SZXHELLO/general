// API配置
const API_BASE_URL = 'http://localhost:8080';
let currentToken = null;
let currentUser = null;

// 游戏常量
const GRID_SIZE = 25;
const TILE_SIZE = 24;
const PLAYER_COLORS = ['#ff7e5f', '#4a90e2', '#2ecc71'];
const NEUTRAL_COLOR = '#34495e';
const MOUNTAIN_COLOR = '#7f8c8d';
const FOG_COLOR = '#2c3e50';
const ARMY_GROWTH_INTERVAL = 2000;

// 游戏状态
let gameState = {
    grid: [],
    players: [
        { id: 0, name: '你', color: PLAYER_COLORS[0], territory: 5, army: 25, general: {x: 2, y: 2} },
        { id: 1, name: '蓝色玩家', color: PLAYER_COLORS[1], territory: 5, army: 25, general: {x: GRID_SIZE-3, y: 2} },
        { id: 2, name: '绿色玩家', color: PLAYER_COLORS[2], territory: 5, army: 25, general: {x: Math.floor(GRID_SIZE/2), y: GRID_SIZE-3} }
    ],
    selectedTile: null,
    gameOver: false,
    playerVision: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false)),
    gameTimer: null,
    autoPlay: false,
    lastAIMove: 0,
    aiMoveInterval: 300 // AI每300毫秒移动一次，与玩家操作速度相当
};

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
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        const statusElement = document.getElementById('serverStatus');
        const statusDot = statusElement.querySelector('.status-dot');
        
        if (response.ok) {
            statusDot.classList.add('connected');
            statusElement.innerHTML = '<span class="status-dot connected"></span> 服务器连接正常';
        } else {
            throw new Error('Server not responding properly');
        }
    } catch (error) {
        const statusElement = document.getElementById('serverStatus');
        statusElement.innerHTML = '<span class="status-dot"></span> 服务器连接失败';
        console.error('服务器连接失败:', error);
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
    
    if (username.length < 3 || username.length > 20) {
        showMessage('用户名长度必须在3-20个字符之间', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('密码长度至少6个字符', 'error');
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
}

function logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }
    
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
    gameState.playerVision = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false));
    
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
    
    // 重置玩家状态
    gameState.players.forEach(player => {
        player.territory = 5;
        player.army = 25;
    });
    
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
    
    // 生成山脉
    generateMountains(25);
    
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
    
    // 山脉始终可见
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameState.grid[y][x].type === 'mountain') {
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
    const fromTile = gameState.grid[fromY][fromX];
    const toTile = gameState.grid[toY][toX];
    const movingArmy = fromTile.army - 1;
    
    if (toTile.owner === -1) {
        // 移动到空地
        toTile.owner = fromTile.owner;
        toTile.army = movingArmy;
        toTile.type = 'territory';
        fromTile.army = 1;
        
    } else if (toTile.owner === fromTile.owner) {
        // 移动到自己的领地
        toTile.army += movingArmy;
        fromTile.army = 1;
        
    } else {
        // 攻击敌人
        if (movingArmy > toTile.army) {
            // 攻击成功
            toTile.owner = fromTile.owner;
            toTile.army = movingArmy - toTile.army;
            fromTile.army = 1;
            
            // 检查是否占领了将军
            if (toTile.type === 'general') {
                gameState.gameOver = true;
                const winner = gameState.players[fromTile.owner];
                document.getElementById('gameStatus').innerHTML = 
                    `<div class="winning-message">🎉 游戏结束！${winner.name} 获胜！</div>`;
                clearInterval(gameState.gameTimer);
            }
        } else {
            // 攻击失败
            toTile.army -= movingArmy;
            fromTile.army = 1;
        }
    }
    
    updatePlayerStats();
}

function growArmies() {
    if (gameState.gameOver) return;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];
            if (tile.owner !== -1 && tile.type !== 'mountain') {
                tile.army += 1;
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

// 改进的AI移动逻辑 - 更智能的策略
function executeAITurn() {
    for (let i = 1; i < gameState.players.length; i++) {
        const aiPlayer = gameState.players[i];
        
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

// 寻找最佳移动
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
        if (toTile.type === 'general' && toTile.owner !== playerId) {
            if (movingArmy > toTile.army) {
                score = 1000; // 能获胜的攻击
            } else {
                score = 100; // 即使不能获胜也要尝试
            }
        }
        // 攻击敌人 - 高优先级
        else if (toTile.owner !== -1 && toTile.owner !== playerId) {
            if (movingArmy > toTile.army) {
                // 能获胜的攻击
                score = 50 + (movingArmy - toTile.army) * 5;
                
                // 如果攻击后能连接到更多领土，额外加分
                if (wouldConnectTerritories(toX, toY, playerId)) {
                    score += 20;
                }
                
                // 如果攻击的是敌方前线，额外加分
                if (isFrontlineTile(toX, toY, playerId)) {
                    score += 15;
                }
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
            
            // 如果扩张能连接到更多领土，额外加分
            if (wouldConnectTerritories(toX, toY, playerId)) {
                score += 15;
            }
            
            // 如果扩张能接近敌方将军，额外加分
            if (isCloserToEnemyGeneral(toX, toY, playerId)) {
                score += 10;
            }
        }
        // 合并到自己的领土 - 低优先级，但有时有用
        else if (toTile.owner === playerId) {
            // 只有当目标靠近前线或需要加强时才考虑
            if (isFrontlineTile(toX, toY, playerId) && toTile.army < 10) {
                score = 15 + toTile.army;
            } else {
                score = 5;
            }
        }
        
        // 保护将军 - 如果移动会削弱将军防御，减分
        if (isNearGeneral(x, y, playerId) && fromTile.army > 5) {
            score -= 10;
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

// 检查格子是否靠近我方将军
function isNearGeneral(x, y, playerId) {
    const general = gameState.players[playerId].general;
    const distance = Math.abs(x - general.x) + Math.abs(y - general.y);
    return distance <= 2;
}

// 检查攻击后是否能连接更多领土
function wouldConnectTerritories(x, y, playerId) {
    let newConnections = 0;
    const directions = [
        {dx: 0, dy: -1}, {dx: 1, dy: 0}, 
        {dx: 0, dy: 1}, {dx: -1, dy: 0}
    ];
    
    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            const tile = gameState.grid[newY][newX];
            if (tile.owner === playerId) {
                newConnections++;
            }
        }
    }
    
    return newConnections >= 2;
}

// 检查是否是前线格子（与敌人相邻）
function isFrontlineTile(x, y, playerId) {
    const directions = [
        {dx: 0, dy: -1}, {dx: 1, dy: 0}, 
        {dx: 0, dy: 1}, {dx: -1, dy: 0}
    ];
    
    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            const tile = gameState.grid[newY][newX];
            if (tile.owner !== -1 && tile.owner !== playerId && tile.type !== 'mountain') {
                return true;
            }
        }
    }
    
    return false;
}

// 检查移动是否更接近敌方将军
function isCloserToEnemyGeneral(x, y, playerId) {
    let minDistance = Infinity;
    
    // 找到最近的敌方将军
    for (let i = 0; i < gameState.players.length; i++) {
        if (i !== playerId) {
            const general = gameState.players[i].general;
            const distance = Math.abs(x - general.x) + Math.abs(y - general.y);
            minDistance = Math.min(minDistance, distance);
        }
    }
    
    return minDistance < 10; // 如果距离敌方将军小于10格，认为是接近
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
            territoryElement.textContent = player.territory;
            armyElement.textContent = player.army;
        } else {
            territoryElement.textContent = '?';
            armyElement.textContent = '?';
        }
    }
    
    // 更新选中信息
    const selectedInfo = document.getElementById('selectedInfo');
    if (gameState.selectedTile) {
        const tile = gameState.grid[gameState.selectedTile.y][gameState.selectedTile.x];
        selectedInfo.textContent = `选中: 位置(${gameState.selectedTile.x},${gameState.selectedTile.y}) 兵力: ${tile.army}`;
    } else {
        selectedInfo.textContent = '';
    }
    
    // 更新游戏状态
    const statusElement = document.getElementById('gameStatus').querySelector('.status-text');
    if (gameState.gameOver) {
        statusElement.textContent = '游戏结束';
    } else if (gameState.selectedTile) {
        statusElement.textContent = '已选中军队 - 点击相邻格子移动';
    } else {
        statusElement.textContent = '选择你的领地开始移动';
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
  占领敌方将军（👑）来获得胜利！

⚔️ 移动规则：
  • 点击你的领地选择军队（兵力必须 > 1）
  • 点击相邻的格子进行移动
  • 使用方向键移动选中的军队

🏰 移动类型：
  • 移动到自己的领地：源格子保留1兵力，目标格子获得总兵力-1
  • 移动到空地：占领该格子，源格子保留1兵力
  • 移动到敌人领地：进行战斗，兵力多者获胜

📈 军队增长：
  • 每2秒你的所有领地军队数量+1

🕵️ 战争迷雾：
  • 只有你的领土和相邻格子可见
  • 只有相邻的敌人领地才显示军队数量

⛰️ 地形：
  • 山脉无法通过

💡 提示：
  • 优先保护你的将军
  • 扩张领土以获得更多军队
  • 集中兵力攻击敌人弱点
    `;
    
    alert(instructions);
}

// 页面加载初始化
window.onload = function() {
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