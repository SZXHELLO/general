*程序运行方法（前提是配置完Maven后）：
step1:win+R--->输入cmd--->

step2:输入backend-java所在的盘符（如：“E:”），

step3:然后输入cd+backend-java文件的路径（如：“cd E:\作业\基础程序设计大作业\generals-project-2.0\generals-project\backend-java”），

step4:最后输入mvn spring-boot:run，

正常情况下会自动运行，可以参考下图（红框内时上面输入的三条指令,红框下面时程序正常运行的部分反馈结果，如果能够正常运行，是不会跳出红色字样的）

![guide1](C:\Users\25283\Desktop\guide1.png)

*如何打开前端：

在浏览器上访问 http://localhost:8080 应该能看到游戏界面

--------------------------------------------------------------------------------------------------------------------------------------------

## 项目结构（更新后）

```
generals-game/
├── frontend/           # 前端保持不变
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend-java/       # Java后端
│   ├── src/
│   │   └── main/
│   │       ├── java/com/generals/
│   │       │   ├── GeneralsApplication.java
│   │       │   ├── controller/
│   │       │   │   ├─ AuthController.java
|   |       |   |   ├─ AuthResponse.java
│   │       │   │   └── GameController.java
│   │       │   ├── model/
│   │       │   │   ├── User.java
│   │       │   │   └── AuthRequest.java
│   │       │   ├── service/
│   │       │   │   ├── UserService.java
│   │       │   │   └── JwtService.java
│   │       │   └── config/
│   │       │   |   ├── WebConfig.java
│   │       │   |    └── SecurityConfig.java  
│   │       └── resources/
│   │           ├── application.properties
│   │           └── static/          # 前端文件放在这里
│   ├── pom.xml
│   └── README.md
└── README.md
```

## 1. 前端代码

### frontend/index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generals.io - 完整版</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- 登录界面 -->
    <div class="login-container" id="loginContainer">
        <div class="login-form">
            <h1 class="login-title">Generals.io</h1>
            <div class="login-subtitle">登录开始游戏</div>
            
            <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" placeholder="请输入用户名 (3-20字符)" required>
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" placeholder="请输入密码 (至少6字符)" required>
            </div>
            
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
            
            <div class="login-buttons">
                <button class="btn-primary" onclick="login()">登录</button>
                <button class="btn-secondary" onclick="register()">注册</button>
            </div>
            
            <div class="server-status" id="serverStatus">
                <span class="status-dot"></span>
                正在连接服务器...
            </div>
        </div>
    </div>

    <!-- 游戏界面 -->
    <div class="game-container" id="gameContainer">
        <!-- 用户信息 -->
        <div class="user-info">
            <span>欢迎, <span id="currentUser">玩家</span></span>
            <button class="logout-btn" onclick="logout()">退出</button>
        </div>

        <!-- 页面头部 -->
        <div class="header">
            <h1>Generals.io</h1>
            <div class="subtitle">完整移动规则版 - 征服你的敌人！</div>
        </div>

        <!-- 游戏主容器 -->
        <div class="game-content">
            <!-- 游戏棋盘区域 -->
            <div class="game-board-container">
                <div class="game-board">
                    <canvas id="gameCanvas" width="600" height="600"></canvas>
                </div>
                <div class="game-status" id="gameStatus">
                    <div class="status-text">选择你的领地开始游戏</div>
                    <div class="selected-info" id="selectedInfo"></div>
                </div>
            </div>

            <!-- 游戏信息面板 -->
            <div class="game-info">
                <!-- 玩家信息区域 -->
                <div class="info-section">
                    <h2>玩家信息</h2>
                    <div class="players-list">
                        <div class="player active">
                            <div class="player-color" style="background-color: #ff7e5f;"></div>
                            <div class="player-info">
                                <div class="player-name">你 (红色)</div>
                                <div class="player-stats">领土: <span id="playerTerritory">5</span> | 军队: <span id="playerArmy">25</span></div>
                            </div>
                        </div>
                        <div class="player">
                            <div class="player-color" style="background-color: #4a90e2;"></div>
                            <div class="player-info">
                                <div class="player-name">蓝色玩家</div>
                                <div class="player-stats">领土: <span id="blueTerritory">?</span> | 军队: <span id="blueArmy">?</span></div>
                            </div>
                        </div>
                        <div class="player">
                            <div class="player-color" style="background-color: #2ecc71;"></div>
                            <div class="player-info">
                                <div class="player-name">绿色玩家</div>
                                <div class="player-stats">领土: <span id="greenTerritory">?</span> | 军队: <span id="greenArmy">?</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 游戏控制区域 -->
                <div class="info-section">
                    <h2>游戏控制</h2>
                    <div class="controls">
                        <button id="newGameBtn" class="control-btn">新游戏</button>
                        <button id="howToPlayBtn" class="control-btn">游戏规则</button>
                        <button id="autoPlayBtn" class="control-btn">自动演示</button>
                    </div>
                </div>

                <!-- 游戏规则区域 -->
                <div class="info-section instructions">
                    <h2>游戏规则</h2>
                    <div class="rules-list">
                        <div class="rule-item">
                            <span class="highlight">点击你的领地</span>选择军队，然后<span class="highlight">点击相邻格子</span>移动
                        </div>
                        <div class="rule-item">
                            <span class="highlight">移动到自己的领地：</span>源格子保留1兵力，目标格子获得总兵力-1
                        </div>
                        <div class="rule-item">
                            <span class="highlight">移动到空地：</span>占领该格子，源格子保留1兵力
                        </div>
                        <div class="rule-item">
                            <span class="highlight">移动到敌人领地：</span>进行战斗，兵力多者获胜
                        </div>
                        <div class="rule-item">
                            每<span class="highlight">2秒</span>你的军队数量会<span class="highlight">增加</span>
                        </div>
                        <div class="rule-item">
                            占领敌方<span class="highlight">将军</span>（皇冠图标）来获胜
                        </div>
                    </div>
                </div>

                <!-- 操作提示 -->
                <div class="info-section tips">
                    <h2>操作提示</h2>
                    <div class="tip-item">💡 使用方向键移动选中的军队</div>
                    <div class="tip-item">💡 优先保护你的将军</div>
                    <div class="tip-item">💡 扩张领土以获得更多军队</div>
                    <div class="tip-item">💡 只有相邻的敌人领地才可见</div>
                </div>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

### frontend/style.css

```css
/* 全局样式重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 页面主体样式 */
body {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #e6e6e6;
    min-height: 100vh;
    overflow-x: hidden;
}

/* 登录界面样式 */
.login-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.login-form {
    background: rgba(15, 52, 96, 0.95);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    width: 90%;
    max-width: 400px;
    text-align: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 126, 95, 0.3);
}

.login-title {
    font-size: 2.5rem;
    margin-bottom: 10px;
    background: linear-gradient(90deg, #ff7e5f, #feb47b);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
}

.login-subtitle {
    color: #a0a0a0;
    margin-bottom: 30px;
    font-size: 1.1rem;
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #feb47b;
    font-weight: 600;
    font-size: 0.9rem;
}

.form-group input {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #2d4059;
    border-radius: 10px;
    background: rgba(26, 26, 46, 0.8);
    color: #e6e6e6;
    font-size: 16px;
    transition: all 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #ff7e5f;
    box-shadow: 0 0 0 3px rgba(255, 126, 95, 0.2);
    background: rgba(26, 26, 46, 0.9);
}

.login-buttons {
    display: flex;
    gap: 15px;
    margin: 25px 0 20px;
}

.login-buttons button {
    flex: 1;
    padding: 14px;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
}

.btn-primary {
    background: linear-gradient(135deg, #ff7e5f, #feb47b);
    color: white;
}

.btn-secondary {
    background: rgba(45, 64, 89, 0.8);
    color: #e6e6e6;
    border: 2px solid #2d4059;
}

.login-buttons button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 126, 95, 0.4);
}

.btn-secondary:hover {
    border-color: #ff7e5f;
}

.error-message {
    color: #e74c3c;
    margin: 15px 0;
    padding: 12px;
    background: rgba(231, 76, 60, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(231, 76, 60, 0.3);
    display: none;
    font-size: 0.9rem;
}

.success-message {
    color: #2ecc71;
    margin: 15px 0;
    padding: 12px;
    background: rgba(46, 204, 113, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(46, 204, 113, 0.3);
    display: none;
    font-size: 0.9rem;
}

.server-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #a0a0a0;
    font-size: 0.85rem;
    margin-top: 15px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e74c3c;
    animation: pulse 2s infinite;
}

.status-dot.connected {
    background: #2ecc71;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* 游戏界面样式 */
.game-container {
    display: none;
    min-height: 100vh;
    padding: 20px;
}

.user-info {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(15, 52, 96, 0.9);
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 126, 95, 0.3);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 15px;
}

.logout-btn {
    background: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.5);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.3s ease;
}

.logout-btn:hover {
    background: rgba(231, 76, 60, 0.3);
    transform: translateY(-1px);
}

.header {
    text-align: center;
    margin-bottom: 30px;
    padding-top: 20px;
}

h1 {
    font-size: 3rem;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #ff7e5f, #feb47b);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.subtitle {
    font-size: 1.3rem;
    color: #a0a0a0;
    font-weight: 300;
}

.game-content {
    display: flex;
    gap: 30px;
    max-width: 1400px;
    margin: 0 auto;
    align-items: flex-start;
}

/* 游戏棋盘区域 */
.game-board-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.game-board {
    background: rgba(15, 52, 96, 0.8);
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 126, 95, 0.2);
}

canvas {
    display: block;
    border-radius: 10px;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
}

.game-status {
    background: rgba(15, 52, 96, 0.8);
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 126, 95, 0.2);
}

.status-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: #feb47b;
    margin-bottom: 10px;
}

.selected-info {
    font-size: 0.9rem;
    color: #a0a0a0;
}

/* 游戏信息面板 */
.game-info {
    width: 350px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.info-section {
    background: rgba(15, 52, 96, 0.8);
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 126, 95, 0.2);
    backdrop-filter: blur(10px);
}

h2 {
    font-size: 1.4rem;
    margin-bottom: 15px;
    color: #feb47b;
    border-bottom: 2px solid rgba(255, 126, 95, 0.3);
    padding-bottom: 8px;
    font-weight: 600;
}

/* 玩家信息样式 */
.players-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.player {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    transition: all 0.3s ease;
    background: rgba(26, 26, 46, 0.6);
}

.player.active {
    background: rgba(255, 126, 95, 0.1);
    border: 1px solid rgba(255, 126, 95, 0.3);
}

.player:hover {
    background: rgba(45, 64, 89, 0.6);
    transform: translateX(5px);
}

.player-color {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.player-info {
    flex: 1;
}

.player-name {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 4px;
}

.player-stats {
    font-size: 0.85rem;
    color: #a0a0a0;
}

/* 控制按钮 */
.controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.control-btn {
    background: linear-gradient(135deg, #ff7e5f, #feb47b);
    border: none;
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    font-size: 0.95rem;
}

.control-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 126, 95, 0.4);
}

.control-btn:active {
    transform: translateY(0);
}

/* 规则和提示样式 */
.rules-list, .tips {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.rule-item, .tip-item {
    padding: 10px;
    background: rgba(26, 26, 46, 0.4);
    border-radius: 8px;
    font-size: 0.9rem;
    line-height: 1.4;
    border-left: 3px solid #ff7e5f;
}

.highlight {
    color: #feb47b;
    font-weight: 600;
}

.tip-item {
    border-left-color: #4a90e2;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .game-content {
        flex-direction: column;
        align-items: center;
    }
    
    .game-info {
        width: 100%;
        max-width: 600px;
    }
}

@media (max-width: 768px) {
    .game-content {
        gap: 20px;
    }
    
    .game-board {
        padding: 10px;
    }
    
    canvas {
        width: 100%;
        height: auto;
        max-width: 500px;
    }
    
    .user-info {
        position: static;
        margin-bottom: 20px;
        justify-content: space-between;
    }
    
    h1 {
        font-size: 2.2rem;
    }
    
    .subtitle {
        font-size: 1.1rem;
    }
    
    .login-form {
        margin: 20px;
        padding: 30px 25px;
    }
}

@media (max-width: 480px) {
    body {
        padding: 10px;
    }
    
    .game-container {
        padding: 10px;
    }
    
    .login-form {
        padding: 25px 20px;
    }
    
    .login-title {
        font-size: 2rem;
    }
    
    h1 {
        font-size: 1.8rem;
    }
    
    .login-buttons {
        flex-direction: column;
    }
}
```

### frontend/script.js

```javascript
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
        { id: 0, name: '你', color: PLAYER_COLORS[0], territory: 5, army: 25, general: { x: 2, y: 2 }, alive: true },
        { id: 1, name: '蓝色玩家', color: PLAYER_COLORS[1], territory: 5, army: 25, general: { x: GRID_SIZE - 3, y: 2 }, alive: true },
        { id: 2, name: '绿色玩家', color: PLAYER_COLORS[2], territory: 5, army: 25, general: { x: Math.floor(GRID_SIZE / 2), y: GRID_SIZE - 3 }, alive: true }
    ],
    selectedTile: null,
    gameOver: false,
    playerVision: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(false)),
    gameTimer: null,
    autoPlay: false,
    lastAIMove: 0,
    aiMoveInterval: 300
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
            },
            body: JSON.stringify({ username, password })
        });

        'Content-Type'; 'application/json',
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
        const { x, y } = player.general;
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

// 放置将军和初始领土
gameState.players.forEach(player => {
    const { x, y } = player.general;
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
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
    ];

    let territoriesPlaced = 0;
    let queue = [{ x: startX, y: startY }];
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
                queue.push({ x: newX, y: newY });
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
                    { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                    { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
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
                ctx.fillText('👑', tileX + TILE_SIZE / 2, tileY + TILE_SIZE / 2);
            }

            // 绘制塔（城堡） - 新增
            if (tile.type === 'tower') {
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🏰', tileX + TILE_SIZE / 2, tileY + TILE_SIZE / 2);
            }

            // 绘制军队数量（如果可见）
            if (tile.army > 0 && gameState.playerVision[y][x]) {
                if (tile.owner === 0 || isAdjacentToPlayer(x, y)) {
                    ctx.fillStyle = tile.owner === 0 ? '#ffffff' : '#000000';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tile.army.toString(), tileX + TILE_SIZE / 2, tileY + TILE_SIZE / 2);
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
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
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
                gameState.selectedTile = { x, y };
            } else {
                gameState.selectedTile = null;
            }
        }
    } else if (tile.owner === 0 && tile.army > 1) {
        // 选择格子
        gameState.selectedTile = { x, y };
    }

    updateUI();
}

function handleKeyDown(event) {
    if (gameState.gameOver || !gameState.selectedTile) return;

    const { x, y } = gameState.selectedTile;
    let newX = x;
    let newY = y;

    switch (event.key) {
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
        gameState.selectedTile = { x: newX, y: newY };
    } else if (targetTile.owner === 0 && targetTile.army > 1) {
        gameState.selectedTile = { x: newX, y: newY };
    }

    updateUI();
}

function moveArmy(fromX, fromY, toX, toY) {
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
        const winner = gameState.players[0];
        document.getElementById('gameStatus').innerHTML =
            `<div class="winning-message">🎉 游戏结束！${winner.name} 获胜！</div>`;

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
        document.getElementById('gameStatus').innerHTML =
            `<div class="status-text">已击败 ${defeatedPlayers.length}个敌人！继续攻击剩余敌人！</div>`;
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

    nextGameButton.onmouseover = function () {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 20px rgba(255, 126, 95, 0.4)';
    };

    // ==== 修改开始 ====
    // 在 showVictoryModal 函数中找到这个部分：
    nextGameButton.onclick = function () {
        document.body.removeChild(modal);
        initGame();
    };
    // ==== 修改结束 ====

    // ==== 替换为 ====
    nextGameButton.onclick = function () {
        document.body.removeChild(modal);

        // 强制重置游戏结束状态
        gameState.gameOver = false;

        // 重新初始化游戏
        initGame();

        // 手动启动游戏循环
        if (gameState.gameTimer) {
            clearInterval(gameState.gameTimer);
        }
        gameState.gameTimer = setInterval(gameLoop, 100);

        // 强制重新绘制
        const ctx = document.getElementById('gameCanvas').getContext('2d');
        drawGame(ctx);
        updateUI();
    };
    // ==== 修改结束 ====
    nextGameButton.onclick = function () {
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

    menuButton.onmouseover = function () {
        this.style.borderColor = '#ff7e5f';
        this.style.transform = 'translateY(-2px)';
    };

    menuButton.onmouseout = function () {
        this.style.transform = 'translateY(0)';
    };

    menuButton.onclick = function () {
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
                    movableTerritories.push({ x, y, army: tile.army });
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
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
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
            bestMove = { x: toX, y: toY, score };
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

// 页面加载初始化
window.onload = function () {
    console.log('页面加载完成，开始检查服务器状态...');
    checkServerStatus();
    checkLoginStatus();

    // 添加回车键支持
    document.getElementById('password').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    // 每30秒检查一次服务器状态
    setInterval(checkServerStatus, 30000);
};
```

## 

## Java后端代码

### backend-java/pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.generals</groupId>
    <artifactId>generals-game</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.0</version>
        <relativePath/>
    </parent>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <!-- Database -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Password Encryption -->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
        </dependency>
        
        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### backend-java/src/main/java/com/generals/GeneralsApplication.java

```java
package com.generals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GeneralsApplication {
    public static void main(String[] args) {
        SpringApplication.run(GeneralsApplication.class, args);
    }
}
```

### backend-java/src/main/java/com/generals/model/User.java

```java
package com.generals.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20个字符之间")
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // 构造函数
    public User() {
        this.createdAt = LocalDateTime.now();
    }
    
    public User(String username, String password) {
        this();
        this.username = username;
        this.password = password;
    }
    
    // Getter 和 Setter 方法
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
```

### backend-java/src/main/java/com/generals/model/AuthRequest.java

```java
package com.generals.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthRequest {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20个字符之间")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, message = "密码长度至少6个字符")
    private String password;
    
    // 默认构造函数
    public AuthRequest() {}
    
    public AuthRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }
    
    // Getter 和 Setter 方法
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
}
```

### backend-java/src/main/java/com/generals/model/AuthResponse.java

```java
package com.generals.model;

public class AuthResponse {
    private boolean success;
    private String message;
    private String token;
    private UserInfo user;
    
    // 构造函数
    public AuthResponse() {}
    
    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public AuthResponse(boolean success, String message, String token, UserInfo user) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.user = user;
    }
    
    // Getter 和 Setter 方法
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public UserInfo getUser() {
        return user;
    }
    
    public void setUser(UserInfo user) {
        this.user = user;
    }
    
    // 用户信息内部类
    public static class UserInfo {
        private Long id;
        private String username;
        
        public UserInfo() {}
        
        public UserInfo(Long id, String username) {
            this.id = id;
            this.username = username;
        }
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
    }
}
```

### backend-java/src/main/java/com/generals/service/JwtService.java

```java
package com.generals.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {
    
    @Value("${jwt.secret:your-secret-key-change-in-production}")
    private String secret;
    
    @Value("${jwt.expiration:86400}") // 24小时
    private long expiration;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
    
    public String generateToken(Long userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }
    
    public Long extractUserId(String token) {
        return extractClaims(token).get("userId", Long.class);
    }
    
    public Date extractExpiration(String token) {
        return extractClaims(token).getExpiration();
    }
    
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### backend-java/src/main/java/com/generals/service/UserService.java

```java
package com.generals.service;

import com.generals.model.User;
import com.generals.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    public User save(User user) {
        // 加密密码
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }
    
    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
```

### backend-java/src/main/java/com/generals/repository/UserRepository.java

```java
package com.generals.repository;

import com.generals.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
```

### backend-java/src/main/java/com/generals/controller/AuthController.java

```java
package com.generals.controller;

import com.generals.model.AuthRequest;
import com.generals.model.AuthResponse;
import com.generals.model.User;
import com.generals.service.JwtService;
import com.generals.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtService jwtService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        try {
            // 检查用户是否已存在
            if (userService.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(false, "用户名已存在"));
            }
            
            // 创建新用户
            User user = new User(request.getUsername(), request.getPassword());
            User savedUser = userService.save(user);
            
            // 生成JWT令牌
            String token = jwtService.generateToken(savedUser.getId(), savedUser.getUsername());
            
            // 创建响应
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                    savedUser.getId(), savedUser.getUsername());
            
            AuthResponse response = new AuthResponse(
                    true, "注册成功", token, userInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new AuthResponse(false, "服务器错误"));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        try {
            // 查找用户
            Optional<User> userOptional = userService.findByUsername(request.getUsername());
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "用户名或密码错误"));
            }
            
            User user = userOptional.get();
            
            // 验证密码
            if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "用户名或密码错误"));
            }
            
            // 生成JWT令牌
            String token = jwtService.generateToken(user.getId(), user.getUsername());
            
            // 创建响应
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                    user.getId(), user.getUsername());
            
            AuthResponse response = new AuthResponse(
                    true, "登录成功", token, userInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new AuthResponse(false, "服务器错误"));
        }
    }
    
    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verifyToken(@RequestBody VerifyRequest request) {
        try {
            if (request.getToken() == null || request.getToken().isEmpty()) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "未提供令牌"));
            }
            
            if (!jwtService.validateToken(request.getToken())) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse(false, "令牌无效"));
            }
            
            // 提取用户信息
            Long userId = jwtService.extractUserId(request.getToken());
            String username = jwtService.extractUsername(request.getToken());
            
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(userId, username);
            AuthResponse response = new AuthResponse(true, "令牌有效", null, userInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(new AuthResponse(false, "令牌无效"));
        }
    }
    
    // 验证请求的内部类
    public static class VerifyRequest {
        private String token;
        
        public String getToken() {
            return token;
        }
        
        public void setToken(String token) {
            this.token = token;
        }
    }
}
```

### backend-java/src/main/java/com/generals/controller/GameController.java

```java
package com.generals.controller;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {
    
    @GetMapping("/health")
    public Map<String, Object> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Server is running");
        return response;
    }
}
```

### backend-java/src/main/java/com/generals/config/WebConfig.java

```java
package com.generals.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 确保静态资源可以被访问
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
    }
}
```

### backend-java/src/main/java/com/generals/config/SecurityConfig.java

```java
package com.generals.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // 禁用CSRF保护，因为我们是API服务
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/**").permitAll() // API接口允许所有访问
                .requestMatchers("/**").permitAll()     // 静态资源允许所有访问
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}
```

### backend-java/src/main/resources/application.properties

```properties
# 服务器配置
server.port=8080
server.servlet.context-path=/

# 数据库配置 (使用H2内存数据库)
spring.datasource.url=jdbc:h2:mem:generalsdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA配置
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# H2控制台 (开发时可用，生产环境应关闭)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# JWT配置
jwt.secret=your-secret-key-change-in-production
jwt.expiration=86400

# 静态资源
spring.web.resources.static-locations=classpath:/static/
```

## 前端修改

需要修改前端JavaScript中的API配置：

### frontend/script.js（2025/11/28修改后）

```javascript
// API配置 - 使用相对路径
const API_BASE_URL = '';
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

// 游戏状态（保持不变）
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
    aiMoveInterval: 300
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

// 修正的服务器状态检查
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

// 修正的认证函数
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

// 游戏相关函数保持不变...
// [这里是你原有的游戏代码]
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
```

## 部署说明

### 运行Java后端

1. **确保已安装Java 17+ 和 Maven**

2. **构建和运行**：

```bash
cd backend-java
mvn clean package
java -jar target/generals-game-1.0.0.jar
```

3. **访问应用**：
   - 游戏地址：http://localhost:8080
   - H2数据库控制台：http://localhost:8080/h2-console

### 项目结构部署

将前端文件复制到Java项目的静态资源目录：

```
backend-java/src/main/resources/static/
├── index.html
├── style.css
└── script.js
```

## 功能对比

| 功能         | Node.js版本 | Java版本         |
| ------------ | ----------- | ---------------- |
| 用户注册     | ✅           | ✅                |
| 用户登录     | ✅           | ✅                |
| JWT认证      | ✅           | ✅                |
| 数据库存储   | SQLite      | H2（内存数据库） |
| 健康检查     | ✅           | ✅                |
| 静态文件服务 | ✅           | ✅                |
| 跨域支持     | ✅           | ✅                |

这个Java版本提供了与原始Node.js版本完全相同的功能，包括用户认证、JWT令牌管理和游戏服务。主要区别在于技术栈，但用户体验和功能保持一致。