// 导入 Firebase SDK 函数
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, onDisconnect } from "firebase/database";

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBstqdOAluZGj2r18zyz4DLXHM0bE3KdFo",
  authDomain: "number-mine-game.firebaseapp.com",
  databaseURL: "https://number-mine-game-default-rtdb.firebaseio.com",
  projectId: "number-mine-game",
  storageBucket: "number-mine-game.firebasestorage.app",
  messagingSenderId: "327856339824",
  appId: "1:327856339824:web:484729fc5fc9638a332db5",
  measurementId: "G-313FN47ZWX"
};

// 初始化 Firebase 和数据库
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 全局状态对象，管理页面和游戏状态
let state = {
    currentPage: 1,
    userRole: null,
    userId: null,
    roomId: "defaultRoom",
    matchedUserId: null,
    game: {
        hostReady: false,
        guestReady: false,
        digits: 0,
        targetNumber: [],
        guessHistory: [],
        guessNumber: [],
        penColor: 'black'
    }
};

// 当前输入数字
let currentNumber = [];

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing page 1');
    initializeUser();
    initializeEventListeners();
    logInitialState();
    enterRoom();
    listenUserList();
    listenGameState();
});

// 初始化用户
function initializeUser() {
    state.userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    state.userRole = 'pending';
    console.log(`User ${state.userId} initialized`);
    showPage(1);
}

// 进入房间
function enterRoom() {
    const roomRef = ref(database, `rooms/${state.roomId}/users/${state.userId}`);
    set(roomRef, {
        id: state.userId,
        username: `玩家${state.userId.slice(-4)}`,
        role: state.userRole
    }).then(() => {
        console.log(`用户 ${state.userId} 进入房间 ${state.roomId}`);
        updatePage2();
    }).catch((error) => {
        console.error("进入房间失败:", error);
    });
    onDisconnect(roomRef).remove();
}

// 监听用户列表变化
function listenUserList() {
    const usersRef = ref(database, `rooms/${state.roomId}/users`);
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        updateUserList(users);
    }, (error) => {
        console.error("监听用户列表失败:", error);
    });
}

// 监听游戏状态变化
function listenGameState() {
    const gameRef = ref(database, `rooms/${state.roomId}/game`);
    onValue(gameRef, (snapshot) => {
        const gameState = snapshot.val();
        if (gameState) {
            state.game = { ...state.game, ...gameState };
            // 同步页面
            if (gameState.hostReady && gameState.guestReady && state.currentPage < 3) {
                showPage(3);
            }
            if (gameState.targetNumber && gameState.targetNumber.length > 0 && state.currentPage < 5) {
                state.game.targetNumber = gameState.targetNumber;
                showPage(5);
                updateTargetGrid();
                initCanvas();
            }
            if (gameState.guessHistory && gameState.guessHistory.length > 0) {
                state.game.guessHistory = gameState.guessHistory;
                updateHistory();
            }
        }
    }, (error) => {
        console.error("监听游戏状态失败:", error);
    });
}

// 更新用户列表 UI
function updateUserList(users) {
    const userList = document.getElementById('userList');
    if (userList) {
        userList.innerHTML = '';
        if (users) {
            for (const uid in users) {
                const user = users[uid];
                const isSelf = uid === state.userId;
                const userImage = getRandomImage();
                const className = isSelf ? 'self' : (user.role === 'host' ? 'host' : '');
                userList.innerHTML += `
                    <div class="user-item ${className}">
                        <div class="user-image" style="background-image: url('${userImage}');"></div>
                        <button onclick="${isSelf ? '' : `selectUser('${uid}')`}">${user.username} (${user.role})</button>
                    </div>
                `;
            }
        } else {
            userList.innerHTML = '<p>当前没有在线玩家</p>';
        }
    } else {
        console.error('userList element not found');
    }
}

// 刷新用户列表
function refreshUsers() {
    console.log('Refreshing user list');
    listenUserList();
}

// 获取随机图像（模拟）
function getRandomImage() {
    const images = [
        'https://via.placeholder.com/40?text=A',
        'https://via.placeholder.com/40?text=B',
        'https://via.placeholder.com/40?text=C',
        'https://via.placeholder.com/40?text=D'
    ];
    return images[Math.floor(Math.random() * images.length)];
}

// 更换房间
function changeRoom() {
    const newRoomId = prompt("请输入新的房间ID：") || `room_${Date.now().toString(36)}`;
    if (newRoomId !== state.roomId) {
        // 离开当前房间
        const oldRoomRef = ref(database, `rooms/${state.roomId}/users/${state.userId}`);
        remove(oldRoomRef);
        // 更新房间ID并进入新房间
        state.roomId = newRoomId;
        document.getElementById('roomIdDisplay').textContent = state.roomId;
        enterRoom();
        listenUserList();
        listenGameState();
    }
}

// 选择用户并进行匹配
function selectUser(targetUserId) {
    if (targetUserId === state.userId) return;
    state.matchedUserId = targetUserId;
    showPopup(`
        <h2>与 ${targetUserId.slice(-4)} 匹配？</h2>
        <button onclick="match('${targetUserId}')">确认匹配</button>
        <button onclick="closePopup()">取消</button>
    `);
}

// 匹配逻辑
function match(targetUserId) {
    state.userRole = 'host';
    state.game.hostReady = true;
    updateUserRoleInFirebase(state.userId, 'host');
    updateUserRoleInFirebase(targetUserId, 'guest');
    showPopup('<h2>等待对方确认...</h2>');
    console.log(`${state.userId.slice(-4)} (host) matched with ${targetUserId.slice(-4)} (guest)`);
    setTimeout(() => {
        state.game.guestReady = true;
        syncGameState();
        closePopup();
        showPage(3);
    }, 2000);
    updatePage2();
}

// 更新Firebase中的用户角色
function updateUserRoleInFirebase(userId, role) {
    const userRef = ref(database, `rooms/${state.roomId}/users/${userId}`);
    set(userRef, {
        id: userId,
        username: `玩家${userId.slice(-4)}`,
        role: role
    });
}

// 同步游戏状态到Firebase
function syncGameState() {
    const gameRef = ref(database, `rooms/${state.roomId}/game`);
    set(gameRef, state.game);
}

// 显示指定页面的函数
function showPage(pageNum) {
    try {
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
            page.style.opacity = '0';
        });
        const pageId = `page${pageNum}`;
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.style.display = 'block';
            targetPage.style.opacity = '1';
            state.currentPage = pageNum;
            console.log(`Successfully switched to page: ${pageId}`);
            if (pageNum === 2) updatePage2();
        } else {
            console.error(`Page not found: ${pageId}`);
            throw new Error(`Failed to find page: ${pageId}`);
        }
    } catch (error) {
        console.error('Error in showPage:', error);
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Start button clicked, switching to page 2');
            showPage(2);
        });
    } else {
        console.error('Start button not found in DOM');
    }
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshUsers);
    } else {
        console.error('Refresh button not found in DOM');
    }
}

// 更新第二页内容
function updatePage2() {
    const userRoleDisplay = document.getElementById('userRole');
    if (userRoleDisplay) {
        userRoleDisplay.textContent = `你的用户ID: ${state.userId.slice(-4)} | 角色: ${state.userRole || '未匹配'}`;
        document.getElementById('roomIdDisplay').textContent = state.roomId;
    } else {
        console.error('userRole element not found');
    }
}

// 确认数字位数
function confirmDigit() {
    state.game.digits = parseInt(document.getElementById('digitSelect').value) || 0;
    if (state.game.digits > 0) {
        showPage(4);
        updateInputGrid();
    } else {
        console.error('Invalid digit selection');
    }
}

// 更新输入网格
function updateInputGrid() {
    const grid = document.getElementById('inputGrid');
    if (grid) {
        grid.innerHTML = '';
        for (let i = 0; i < state.game.digits; i++) {
            grid.innerHTML += `<div class="cell" id="cell-${i}"></div>`;
        }
        const keyboard = document.getElementById('keyboard');
        if (keyboard) {
            keyboard.innerHTML = '';
            for (let i = 0; i <= 9; i++) {
                keyboard.innerHTML += `<button onclick="addNumber(${i})">${i}</button>`;
            }
            keyboard.innerHTML += `
                <button onclick="deleteNumber()">删除</button>
                <button onclick="clearInput()">清空</button>
            `;
        }
    } else {
        console.error('inputGrid or keyboard not found');
    }
}

// 添加数字
function addNumber(num) {
    if (currentNumber.length < state.game.digits) {
        currentNumber.push(num);
        updateCells();
    }
}

// 删除数字
function deleteNumber() {
    currentNumber.pop();
    updateCells();
}

// 清空输入
function clearInput() {
    currentNumber = [];
    updateCells();
}

// 更新单元格显示
function updateCells() {
    const cells = document.querySelectorAll('#inputGrid .cell');
    cells.forEach((cell, i) => {
        cell.textContent = currentNumber[i] || '';
        cell.classList.toggle('filled', !!currentNumber[i]);
    });
}

// 确认目标数字
function confirmNumber() {
    if (currentNumber.length === state.game.digits) {
        state.game.targetNumber = [...currentNumber];
        showPopup(`
            <h2>是否确认让对方猜这个号码？</h2>
            <p>${currentNumber.join('')}</p>
            <button onclick="startGuess()">确认</button>
            <button onclick="cancelConfirm()">取消</button>
        `);
    } else {
        alert('请填满所有格子！');
    }
}

// 取消确认
function cancelConfirm() {
    closePopup();
}

// 开始猜测
function startGuess() {
    closePopup();
    showPage(5);
    updateTargetGrid();
    initCanvas();
    syncGameState();
}

// 更新目标网格
function updateTargetGrid() {
    const grid = document.getElementById('targetGrid');
    if (grid) {
        grid.innerHTML = '';
        for (let i = 0; i < state.game.digits; i++) {
            grid.innerHTML += `<div class="cell">${state.game.targetNumber[i]}</div>`;
        }
        grid.style.opacity = '0';
    }
}

// 显示猜测弹窗
function showGuessPopup() {
    state.game.guessNumber = [];
    showPopup(`
        <h2>输入你的猜测</h2>
        <div class="grid" id="guessGrid"></div>
        <div class="keyboard" id="guessKeyboard"></div>
        <button onclick="clearGuess()">清空</button>
        <button onclick="submitGuess()">确认</button>
    `);
    const grid = document.getElementById('guessGrid');
    if (grid) {
        for (let i = 0; i < state.game.digits; i++) {
            grid.innerHTML += `<div class="cell" id="guess-cell-${i}"></div>`;
        }
        const keyboard = document.getElementById('guessKeyboard');
        if (keyboard) {
            for (let i = 0; i <= 9; i++) {
                keyboard.innerHTML += `<button onclick="addGuess(${i})">${i}</button>`;
            }
            keyboard.innerHTML += `<button onclick="deleteGuess()">删除</button>`;
        }
    }
}

// 添加猜测数字
function addGuess(num) {
    if (state.game.guessNumber.length < state.game.digits) {
        state.game.guessNumber.push(num);
        updateGuessCells();
    }
}

// 删除猜测数字
function deleteGuess() {
    state.game.guessNumber.pop();
    updateGuessCells();
}

// 清空猜测
function clearGuess() {
    state.game.guessNumber = [];
    updateGuessCells();
}

// 更新猜测单元格
function updateGuessCells() {
    const cells = document.querySelectorAll('#guessGrid .cell');
    cells.forEach((cell, i) => {
        cell.textContent = state.game.guessNumber[i] || '';
        cell.classList.toggle('filled', !!state.game.guessNumber[i]);
    });
}

// 提交猜测
function submitGuess() {
    if (state.game.guessNumber.length === state.game.digits) {
        const target = state.game.targetNumber;
        let hits = 0;
        for (let i = 0; i < state.game.digits; i++) {
            if (state.game.guessNumber[i] === target[i]) hits++;
        }
        state.game.guessHistory.push({ guess: state.game.guessNumber.join(''), hits });
        updateHistory();
        syncGameState();
        if (hits === state.game.digits) {
            const targetGrid = document.getElementById('targetGrid');
            if (targetGrid) {
                targetGrid.style.opacity = '1';
                targetGrid.querySelectorAll('.cell').forEach(cell => cell.classList.add('correct'));
                showPopup(`
                    <h2>恭喜您猜对了！</h2>
                    <p>您用了 ${state.game.guessHistory.length} 次</p>
                    <button onclick="resetGame()">再玩一次</button>
                `);
            }
        } else {
            document.getElementById('popup').innerHTML += `
                <p>命中：${hits}</p>
                <button onclick="closePopup()">确认</button>
            `;
        }
    }
}

// 更新历史记录
function updateHistory() {
    const history = document.getElementById('history');
    if (history) {
        history.innerHTML = '';
        state.game.guessHistory.forEach((item, index) => {
            history.innerHTML += `<p>${index + 1}. ${item.guess} - 命中: ${item.hits}</p>`;
        });
        history.scrollTop = history.scrollHeight;
    }
}

// 重置游戏
function resetGame() {
    const roomRef = ref(database, `rooms/${state.roomId}/users/${state.userId}`);
    remove(roomRef);
    const gameRef = ref(database, `rooms/${state.roomId}/game`);
    remove(gameRef);
    state = {
        currentPage: 1,
        userRole: null,
        userId: null,
        roomId: "defaultRoom",
        matchedUserId: null,
        game: {
            hostReady: false,
            guestReady: false,
            digits: 0,
            targetNumber: [],
            guessHistory: [],
            guessNumber: [],
            penColor: 'black'
        }
    };
    currentNumber = [];
    closePopup();
    showPage(1);
    location.reload();
}

// 弹窗管理
function showPopup(content) {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.innerHTML = content;
        popup.style.display = 'block';
    } else {
        console.error('Popup element not found');
    }
}

function closePopup() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.style.display = 'none';
        popup.innerHTML = '';
    }
}

// 初始化画布
function initCanvas() {
    const canvas = document.getElementById('noteCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context not available');
        return;
    }
    let drawing = false;
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.game.penColor;
    canvas.addEventListener('mousedown', () => drawing = true);
    canvas.addEventListener('mouseup', () => drawing = false);
    canvas.addEventListener('mousemove', (e) => {
        if (drawing) {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        }
    });
}

// 更改画笔颜色
function changePenColor(color) {
    state.game.penColor = color;
    const canvas = document.getElementById('noteCanvas');
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        ctx.strokeStyle = color;
    }
}

// 清除画布
function clearCanvas() {
    const canvas = document.getElementById('noteCanvas');
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// 记录初始状态
function logInitialState() {
    console.log('Initial state:', JSON.stringify(state, null, 2));
    console.log('Checking DOM elements:', {
        startButton: document.getElementById('startButton'),
        page1: document.getElementById('page1'),
        page2: document.getElementById('page2')
    });
}