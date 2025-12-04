// API配置 - 使用相对路径
const API_BASE_URL = '';
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
        { id: 0, name: '你', color: PLAYER_COLORS[0], territory: 5, army: 25, general: {x: 0, y: 0}, alive: true, isHuman: true },
        { id: 1, name: '蓝色玩家', color: PLAYER_COLORS[1], territory: 5, army: 25, general: {x: 0, y: 0}, alive: true, isHuman: false },
        { id: 2, name: '绿色玩家', color: PLAYER_COLORS[2], territory: 5, army: 25, general: {x: 0, y: 0}, alive: true, isHuman: false }
    ],
    selectedTile: null,
    gameOver: false,
    playerVision: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false)),
    gameTimer: null,
    autoPlay: false,
    lastAIMove: 0,
    aiMoveInterval: 300, // AI移动间隔300ms
    humanPlayerId: 0,
    aiAggressiveness: 0.8, // AI攻击性系数，0-1之间，越高越积极攻击人类
    lastPlayerMove: 0, // 添加：记录玩家上一次移动的时间
    playerMoveInterval: 300 // 添加：玩家移动间隔，与AI相同
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
    gameState.lastPlayerMove = 0; // 重置玩家移动时间戳
    gameState.playerVision = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false));
    
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
    
    // 随机生成玩家起始位置
    generateRandomStartingPositions();
    
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

// 随机生成玩家起始位置函数
function generateRandomStartingPositions() {
    const usedPositions = new Set();
    
    gameState.players.forEach(player => {
        let attempts = 0;
        let positionFound = false;
        
        while (!positionFound && attempts < 100) {
            attempts++;
            
            // 随机生成位置
            const x = Math.floor(Math.random() * (GRID_SIZE - 6)) + 3;
            const y = Math.floor(Math.random() * (GRID_SIZE - 6)) + 3;
            
            // 检查位置是否可用
            const positionKey = `${x},${y}`;
            let tooClose = false;
            
            // 检查是否离其他玩家太近（至少5格距离）
            for (const usedPos of usedPositions) {
                const [usedX, usedY] = usedPos.split(',').map(Number);
                const distance = Math.sqrt(Math.pow(x - usedX, 2) + Math.pow(y - usedY, 2));
                if (distance < 8) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose && !usedPositions.has(positionKey)) {
                // 设置玩家将军位置
                player.general.x = x;
                player.general.y = y;
                
                // 放置将军
                gameState.grid[y][x] = {
                    type: 'general',
                    owner: player.id,
                    army: 10
                };
                
                // 生成初始领土
                generatePlayerTerritory(player.id, x, y, 4);
                
                usedPositions.add(positionKey);
                positionFound = true;
                console.log(`玩家 ${player.id} 初始位置: (${x}, ${y})`);
            }
        }
        
        if (!positionFound) {
            console.warn(`无法为玩家 ${player.id} 找到合适位置，使用备用位置`);
            // 使用备用位置
            const backupPositions = [
                {x: 3, y: 3},
                {x: GRID_SIZE - 4, y: 3},
                {x: Math.floor(GRID_SIZE/2), y: GRID_SIZE - 4}
            ];
            
            const pos = backupPositions[player.id];
            player.general.x = pos.x;
            player.general.y = pos.y;
            
            gameState.grid[pos.y][pos.x] = {
                type: 'general',
                owner: player.id,
                army: 10
            };
            
            generatePlayerTerritory(player.id, pos.x, pos.y, 4);
        }
    });
}

function setupEventListeners() {
    const canvas = document.getElementById('gameCanvas');
    const newGameBtn = document.getElementById('newGameBtn');
    const howToPlayBtn = document.getElementById('howToPlayBtn');
    
    // 移除旧的事件监听器
    canvas.removeEventListener('click', handleCanvasClick);
    newGameBtn.removeEventListener('click', initGame);
    howToPlayBtn.removeEventListener('click', showInstructions);
    document.removeEventListener('keydown', handleKeyDown);
    
    // 添加新的事件监听器
    canvas.addEventListener('click', handleCanvasClick);
    newGameBtn.addEventListener('click', initGame);
    howToPlayBtn.addEventListener('click', showInstructions);
    document.addEventListener('keydown', handleKeyDown);
}

// 生成塔函数
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
            return dx <= 3 && dy <= 3;
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
            
            // 绘制塔（城堡）
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
            
            // 移动后重新检查目标格子状态
            const newTargetTile = gameState.grid[y][x];
            
            // 只有在移动到自己的领地且兵力>1时才保持选中
            if (newTargetTile.owner === 0 && newTargetTile.army > 1) {
                gameState.selectedTile = {x, y};
            } else {
                // 否则取消选中（包括攻击敌人或移动到空地）
                gameState.selectedTile = null;
            }
        } else {
            // 选择新的格子 - 只有自己的格子才能被选中
            if (tile.owner === 0 && tile.army > 1) {
                gameState.selectedTile = {x, y};
            } else {
                gameState.selectedTile = null;
            }
        }
    } else if (tile.owner === 0 && tile.army > 1) {
        // 选择格子 - 只有自己的格子才能被选中
        gameState.selectedTile = {x, y};
    }
    
    updateUI();
}

function handleKeyDown(event) {
    // 阻止方向键的默认滚动行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
        event.preventDefault();
    }
    
    if (gameState.gameOver || !gameState.selectedTile) return;
    
    const currentTime = Date.now();
    
    // 限制玩家移动速度：只有当距离上一次移动超过300ms时才允许移动
    if (currentTime - gameState.lastPlayerMove < gameState.playerMoveInterval) {
        return; // 移动太快，忽略此次按键
    }
    
    const {x, y} = gameState.selectedTile;
    let newX = x;
    let newY = y;
    
    switch(event.key) {
        case 'ArrowUp': newY = y - 1; break;
        case 'ArrowDown': newY = y + 1; break;
        case 'ArrowLeft': newX = x - 1; break;
        case 'ArrowRight': newX = x + 1; break;
        case 'Escape': 
            gameState.selectedTile = null; 
            updateUI();
            return;
        default: return;
    }
    
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;
    
    const selected = gameState.grid[y][x];
    const targetTile = gameState.grid[newY][newX];
    
    if (selected.army > 1 && targetTile.type !== 'mountain') {
        moveArmy(x, y, newX, newY);
        
        // 更新玩家最后移动时间
        gameState.lastPlayerMove = currentTime;
        
        // 移动后重新检查目标格子状态
        const newTargetTile = gameState.grid[newY][newX];
        
        // 只有在移动到自己的领地且兵力>1时才保持选中
        if (newTargetTile.owner === 0 && newTargetTile.army > 1) {
            gameState.selectedTile = {x: newX, y: newY};
        } else {
            // 否则取消选中（包括攻击敌人或移动到空地）
            gameState.selectedTile = null;
        }
    } else if (targetTile.owner === 0 && targetTile.army > 1) {
        // 只是切换选中的格子（移动到自己的另一个领地）
        gameState.selectedTile = {x: newX, y: newY};
    }
    
    updateUI();
}

function moveArmy(fromX, fromY, toX, toY) {
    const fromTile = gameState.grid[fromY][fromX];
    const toTile = gameState.grid[toY][toX];
    const movingArmy = fromTile.army - 1;
    let shouldKeepSelected = false;
    
    if (toTile.owner === -1) {
        // 移动到空地或塔
        if (toTile.type === 'tower') {
            if (movingArmy >= TOWER_INITIAL_ARMY) {
                toTile.owner = fromTile.owner;
                toTile.army = movingArmy;
                fromTile.army = 1;
            } else {
                toTile.army -= movingArmy;
                fromTile.army = 1;
                updateGameStatus(`兵力不足！需要至少${TOWER_INITIAL_ARMY}兵力才能占领塔`);
                return false;
            }
        } else {
            toTile.owner = fromTile.owner;
            toTile.army = movingArmy;
            toTile.type = 'territory';
            fromTile.army = 1;
        }
        
    } else if (toTile.owner === fromTile.owner) {
        // 移动到自己的领地
        toTile.army += movingArmy;
        fromTile.army = 1;
        // 移动到自己的领地时，如果新格子兵力>1，可以保持选中
        if (toTile.army > 1) {
            shouldKeepSelected = true;
        }
        
    } else {
        // 攻击敌人
        if (movingArmy > toTile.army) {
            // 记录被击败的玩家ID
            const defeatedPlayerId = toTile.owner;
            
            // 攻击成功
            toTile.owner = fromTile.owner;
            toTile.army = movingArmy - toTile.army;
            fromTile.army = 1;
            
            // 检查是否占领了将军
            if (toTile.type === 'general') {
                const defeatedPlayer = gameState.players[defeatedPlayerId];
                defeatedPlayer.alive = false;
                
                if (defeatedPlayerId === 0) {
                    handleHumanDefeat(fromTile.owner);
                    return false;
                }
                
                conquerPlayerTerritories(defeatedPlayerId, fromTile.owner);
                checkGameWinCondition();
            }
        } else {
            // 攻击失败
            toTile.army -= movingArmy;
            fromTile.army = 1;
        }
    }
    
    updatePlayerStats();
    return shouldKeepSelected;
}

// 更新游戏状态消息的辅助函数
function updateGameStatus(message) {
    const gameStatus = document.getElementById('gameStatus');
    // 重置gameStatus的内容
    gameStatus.innerHTML = `
        <div class="status-text">${message}</div>
        <div class="selected-info" id="selectedInfo"></div>
    `;
}

// 处理人类玩家失败
function handleHumanDefeat(conquerorId) {
    gameState.gameOver = true;
    
    // 停止游戏计时器
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }
    
    // 标记人类玩家死亡
    const humanPlayer = gameState.players[0];
    humanPlayer.alive = false;
    
    // 获取征服者信息
    const conqueror = gameState.players[conquerorId];
    
    // 显示失败消息
    updateGameStatus(`💀 你的将军被 ${conqueror.name} 占领！游戏失败！`);
    
    // 延迟显示失败窗口
    setTimeout(() => {
        showDefeatModal(conqueror);
    }, 800);
}

// 显示失败模态窗口
function showDefeatModal(conqueror) {
    // 创建模态窗口
    const modal = document.createElement('div');
    modal.id = 'defeatModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '2000';
    
    // 创建内容区域
    const content = document.createElement('div');
    content.style.background = 'linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%)';
    content.style.padding = '40px';
    content.style.borderRadius = '20px';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.8)';
    content.style.border = '2px solid rgba(231, 76, 60, 0.5)';
    content.style.maxWidth = '500px';
    content.style.width = '90%';
    
    // 创建标题
    const title = document.createElement('h2');
    title.textContent = '💀 游戏失败！ 💀';
    title.style.color = '#e74c3c';
    title.style.fontSize = '2.5rem';
    title.style.marginBottom = '20px';
    title.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    title.style.webkitBackgroundClip = 'text';
    title.style.backgroundClip = 'text';
    title.style.color = 'transparent';
    title.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
    
    // 创建失败信息
    const defeatInfo = document.createElement('div');
    defeatInfo.style.marginBottom = '30px';
    defeatInfo.style.color = '#e6e6e6';
    
    const conquerorText = document.createElement('p');
    conquerorText.textContent = `你的将军被 ${conqueror.name} 占领了！`;
    conquerorText.style.fontSize = '1.3rem';
    conquerorText.style.margin = '15px 0';
    conquerorText.style.fontWeight = '600';
    
    const statsText = document.createElement('p');
    statsText.textContent = `最终领土: ${gameState.players[0].territory} | 最终军队: ${gameState.players[0].army}`;
    statsText.style.fontSize = '1.1rem';
    statsText.style.margin = '10px 0';
    statsText.style.color = '#bdc3c7';
    
    defeatInfo.appendChild(conquerorText);
    defeatInfo.appendChild(statsText);
    
    // 创建提示信息
    const tips = document.createElement('div');
    tips.style.marginBottom = '30px';
    tips.style.padding = '15px';
    tips.style.background = 'rgba(231, 76, 60, 0.1)';
    tips.style.borderRadius = '10px';
    tips.style.borderLeft = '4px solid #e74c3c';
    
    const tipTitle = document.createElement('h3');
    tipTitle.textContent = '失败原因分析';
    tipTitle.style.color = '#f39c12';
    tipTitle.style.fontSize = '1.2rem';
    tipTitle.style.marginBottom = '10px';
    
    const tipList = document.createElement('ul');
    tipList.style.textAlign = 'left';
    tipList.style.paddingLeft = '20px';
    tipList.style.color = '#ecf0f1';
    
    const tipsArray = [
        '将军位置暴露，没有足够的保护',
        '兵力分散，没有集中防御',
        '没有及时扩张领土获得更多军队',
        '忽视了AI的协同攻击'
    ];
    
    tipsArray.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        li.style.margin = '8px 0';
        li.style.fontSize = '0.95rem';
        tipList.appendChild(li);
    });
    
    tips.appendChild(tipTitle);
    tips.appendChild(tipList);
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.alignItems = 'center';
    
    // 创建重新开始按钮
    const restartButton = document.createElement('button');
    restartButton.textContent = '重新开始';
    restartButton.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.padding = '15px 30px';
    restartButton.style.borderRadius = '10px';
    restartButton.style.fontSize = '1.2rem';
    restartButton.style.cursor = 'pointer';
    restartButton.style.fontWeight = '600';
    restartButton.style.transition = 'all 0.3s ease';
    restartButton.style.width = '200px';
    
    restartButton.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 20px rgba(231, 76, 60, 0.6)';
    };
    
    restartButton.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    };
    
    restartButton.onclick = function() {
        document.body.removeChild(modal);
        // 重置gameStatus的HTML结构
        const gameStatus = document.getElementById('gameStatus');
        gameStatus.innerHTML = `
            <div class="status-text">选择你的领地开始游戏</div>
            <div class="selected-info" id="selectedInfo"></div>
        `;
        initGame();
    };
    
    // 创建返回主菜单按钮
    const menuButton = document.createElement('button');
    menuButton.textContent = '返回主菜单';
    menuButton.style.background = 'rgba(52, 73, 94, 0.8)';
    menuButton.style.color = '#ecf0f1';
    menuButton.style.border = '2px solid #34495e';
    menuButton.style.padding = '12px 24px';
    menuButton.style.borderRadius = '10px';
    menuButton.style.fontSize = '1.1rem';
    menuButton.style.cursor = 'pointer';
    menuButton.style.fontWeight = '600';
    menuButton.style.transition = 'all 0.3s ease';
    menuButton.style.width = '200px';
    
    menuButton.onmouseover = function() {
        this.style.borderColor = '#e74c3c';
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
    buttonContainer.appendChild(restartButton);
    buttonContainer.appendChild(menuButton);
    
    content.appendChild(title);
    content.appendChild(defeatInfo);
    content.appendChild(tips);
    content.appendChild(buttonContainer);
    
    modal.appendChild(content);
    
    // 添加到页面
    document.body.appendChild(modal);
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
    updateGameStatus(`已击败 ${defeatedPlayer.name}！占领了 ${conqueredCount} 块领土！`);
    
    console.log(`征服了玩家 ${defeatedPlayerId} 的 ${conqueredCount} 块领土`);
}

// 检查游戏胜利条件
function checkGameWinCondition() {
    const aliveEnemies = gameState.players.filter((player, index) => index !== 0 && player.alive);
    
    if (aliveEnemies.length === 0) {
        gameState.gameOver = true;
        const winner = gameState.players[0];
        updateGameStatus(`🎉 游戏结束！${winner.name} 获胜！`);
        
        if (gameState.gameTimer) {
            clearInterval(gameState.gameTimer);
        }
        
        // 延迟显示胜利窗口，让玩家看到最终状态
        setTimeout(() => {
            showVictoryModal();
        }, 1000);
    } else {
        // 只是击败了一个玩家，游戏继续
        const defeatedPlayers = gameState.players.filter((player, index) => index !== 0 && !player.alive);
        updateGameStatus(`已击败 ${defeatedPlayers.length}个敌人！继续攻击剩余敌人！`);
    }
}

// 显示胜利模态窗口
function showVictoryModal() {
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
    
    stats.appendChild(territoryStat);
    stats.appendChild(armyStat);
    
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
        // 重置gameStatus的HTML结构
        const gameStatus = document.getElementById('gameStatus');
        gameStatus.innerHTML = `
            <div class="status-text">选择你的领地开始游戏</div>
            <div class="selected-info" id="selectedInfo"></div>
        `;
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
    if (gameState.gameOver) return;
    
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

// 增强的AI移动函数
function executeAITurn() {
    for (let i = 1; i < gameState.players.length; i++) {
        const aiPlayer = gameState.players[i];
        if (!aiPlayer.alive) continue; // 跳过已死亡的AI玩家
        
        // AI攻击性：根据游戏状态调整AI行为
        const currentAggressiveness = gameState.aiAggressiveness;
        
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
        
        // 根据攻击性决定AI行为
        if (Math.random() < currentAggressiveness) {
            // 攻击性模式：优先攻击人类玩家
            const attackResult = tryAggressiveAttack(aiPlayer, movableTerritories);
            if (!attackResult) {
                // 如果无法直接攻击，则尝试其他策略
                executeDefensiveOrExpansionMove(aiPlayer, movableTerritories);
            }
        } else {
            // 正常模式：混合策略
            executeMixedStrategy(aiPlayer, movableTerritories);
        }
    }
}

// 尝试攻击性攻击人类玩家
function tryAggressiveAttack(aiPlayer, movableTerritories) {
    // 寻找人类玩家的领土和将军
    const humanTiles = [];
    const humanGeneral = gameState.players[0].general;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.grid[y][x];
            if (tile.owner === gameState.humanPlayerId && tile.army > 0) {
                humanTiles.push({x, y, army: tile.army, distanceToGeneral: Math.abs(x - humanGeneral.x) + Math.abs(y - humanGeneral.y)});
            }
        }
    }
    
    if (humanTiles.length === 0) return false;
    
    // 按距离人类将军的远近排序，优先攻击靠近将军的领土
    humanTiles.sort((a, b) => a.distanceToGeneral - b.distanceToGeneral);
    
    // 尝试攻击人类领土
    for (const humanTile of humanTiles) {
        // 寻找可以攻击这个人类领土的AI领土
        for (const territory of movableTerritories) {
            const dx = Math.abs(territory.x - humanTile.x);
            const dy = Math.abs(territory.y - humanTile.y);
            const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
            
            if (isAdjacent && territory.army - 1 > humanTile.army) {
                // 有足够兵力攻击
                moveArmy(territory.x, territory.y, humanTile.x, humanTile.y);
                console.log(`AI玩家 ${aiPlayer.id} 攻击人类领土 (${humanTile.x}, ${humanTile.y})`);
                return true;
            }
        }
    }
    
    return false;
}

// 执行防守或扩张移动
function executeDefensiveOrExpansionMove(aiPlayer, movableTerritories) {
    // 首先尝试扩张到空地
    for (const territory of movableTerritories) {
        const bestMove = findBestMove(territory.x, territory.y, aiPlayer.id);
        
        if (bestMove && bestMove.score > 15) {
            moveArmy(territory.x, territory.y, bestMove.x, bestMove.y);
            return;
        }
    }
    
    // 如果没有好的扩张机会，则尝试合并兵力
    if (movableTerritories.length > 1) {
        // 寻找可以合并的相邻领土
        for (const territory of movableTerritories) {
            const directions = [
                {dx: 0, dy: -1}, {dx: 1, dy: 0}, 
                {dx: 0, dy: 1}, {dx: -1, dy: 0}
            ];
            
            for (const dir of directions) {
                const toX = territory.x + dir.dx;
                const toY = territory.y + dir.dy;
                
                if (toX < 0 || toX >= GRID_SIZE || toY < 0 || toY >= GRID_SIZE) continue;
                
                const targetTile = gameState.grid[toY][toX];
                if (targetTile.owner === aiPlayer.id && targetTile.type !== 'mountain') {
                    // 合并兵力
                    moveArmy(territory.x, territory.y, toX, toY);
                    return;
                }
            }
        }
    }
}

// 执行混合策略
function executeMixedStrategy(aiPlayer, movableTerritories) {
    // 寻找最佳移动
    for (const territory of movableTerritories) {
        const bestMove = findBestMove(territory.x, territory.y, aiPlayer.id);
        
        if (bestMove) {
            moveArmy(territory.x, territory.y, bestMove.x, bestMove.y);
            break;
        }
    }
}

// 增强的findBestMove函数
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
        
        // 攻击人类玩家将军 - 最高优先级
        if (toTile.type === 'general' && toTile.owner === gameState.humanPlayerId) {
            if (movingArmy > toTile.army) {
                score = 1500 + (movingArmy - toTile.army) * 10; // 能获胜的攻击，额外奖励
            } else {
                score = 300; // 即使不能获胜也要尝试
            }
        }
        // 攻击人类玩家领土 - 高优先级
        else if (toTile.owner === gameState.humanPlayerId) {
            if (movingArmy > toTile.army) {
                // 能获胜的攻击
                score = 80 + (movingArmy - toTile.army) * 8;
            } else if (movingArmy === toTile.army) {
                // 平局攻击
                score = 40;
            } else {
                // 劣势攻击 - 但仍然尝试
                score = Math.max(20, movingArmy - toTile.army + 20);
            }
        }
        // 攻击敌方将军 - 高优先级
        else if (toTile.type === 'general' && toTile.owner !== playerId && toTile.owner !== -1) {
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
        // 攻击其他AI敌人 - 中等优先级
        else if (toTile.owner !== -1 && toTile.owner !== playerId && toTile.owner !== gameState.humanPlayerId) {
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
        
        // 添加攻击性系数影响
        if (toTile.owner === gameState.humanPlayerId) {
            score *= (1 + gameState.aiAggressiveness);
        }
        
        // 添加随机因素使AI行为更不可预测
        score += Math.random() * 15;
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = {x: toX, y: toY, score};
        }
    }
    
    // 根据攻击性调整阈值
    const threshold = playerId === gameState.humanPlayerId ? 10 : 15;
    return bestScore > threshold ? bestMove : null;
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
    // 安全地更新玩家统计
    const playerTerritoryElement = document.getElementById('playerTerritory');
    const playerArmyElement = document.getElementById('playerArmy');
    
    if (playerTerritoryElement && playerArmyElement) {
        playerTerritoryElement.textContent = gameState.players[0].territory;
        playerArmyElement.textContent = gameState.players[0].army;
    }
    
    // 更新敌人统计（如果可见）
    for (let i = 1; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        const canSee = canSeePlayerInfo(i);
        
        const territoryElement = document.getElementById(i === 1 ? 'blueTerritory' : 'greenTerritory');
        const armyElement = document.getElementById(i === 1 ? 'blueArmy' : 'greenArmy');
        
        if (territoryElement && armyElement) {
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
    }
    
    // 更新选中信息
    const selectedInfo = document.getElementById('selectedInfo');
    if (selectedInfo) {
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
    }
    
    // 更新游戏状态（只在游戏未结束时）
    if (!gameState.gameOver) {
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) {
            let statusText = gameStatus.querySelector('.status-text');
            if (!statusText) {
                // 如果不存在，重新创建
                statusText = document.createElement('div');
                statusText.className = 'status-text';
                gameStatus.prepend(statusText);
            }
            
            if (gameState.selectedTile) {
                statusText.textContent = '已选中军队 - 点击相邻格子移动';
            } else {
                // 显示剩余敌人数量
                const aliveEnemies = gameState.players.filter((player, index) => index !== 0 && player.alive).length;
                statusText.textContent = `选择你的领地开始移动 - 剩余敌人: ${aliveEnemies}`;
                
                // 显示AI攻击性提示
                if (gameState.aiAggressiveness > 0.7) {
                    statusText.textContent += ' (AI攻击性高)';
                }
            }
        }
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

function showInstructions() {
    const instructions = `
Generals.io 游戏规则：

🎯 目标：
  占领所有敌方将军（👑）来获得胜利！

⚔️ 移动规则：
  • 点击你的领地选择军队（兵力必须 > 1）
  • 点击相邻的格子进行移动
  • 使用方向键移动选中的军队
  • 移动速度限制：玩家和AI移动速度相同（每300ms一次）

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

🤖 AI行为：
  • AI会主动攻击人类玩家
  • AI会根据局势调整攻击性
  • 蓝色和绿色AI会协同攻击人类
  • AI移动速度：每300ms移动一次

💀 失败条件：
  • 你的将军被AI占领时，游戏立即失败
  • 失败后会显示分析报告和重新开始选项

💡 提示：
  • 优先保护你的将军
  • 占领塔以获得兵力优势
  • 需要击败所有敌人才能获胜
  • 集中兵力攻击敌人弱点
  • AI攻击性很高，注意防守
  • 移动速度已被平衡，与AI公平竞争
    `;
    
    alert(instructions);
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