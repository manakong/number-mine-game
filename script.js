// 全局状态对象，管理页面和游戏状态
let state = {
    currentPage: 1,
    userRole: null,
    userId: null,
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

// 模拟多用户状态
let users = new Set();

// 在页面加载时初始化，确保第一页可见
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing page 1');
    initializeUserRole();
    showPage(1);
    initializeEventListeners();
    logInitialState();
});

// 初始化用户角色
function initializeUserRole() {
    // 生成唯一用户 ID
    state.userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    let existingUsers = JSON.parse(localStorage.getItem('users'));
    if (!existingUsers.includes(state.userId)) {
        existingUsers.push(state.userId);
        localStorage.setItem('users', JSON.stringify(existingUsers));
        users.add(state.userId);
    }
    state.userRole = null; // 角色由房间匹配决定
    localStorage.setItem('userRole_' + state.userId, 'pending');
    console.log(`User ${state.userId} initialized, total users: ${existingUsers.length}`);
    showPage(2); // 直接进入房间页面
}

// 显示指定页面的函数，包含错误处理
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

// 更新第二页内容（房间）
function updatePage2() {
    const userRoleDisplay = document.getElementById('userRole');
    if (userRoleDisplay) {
        userRoleDisplay.textContent = `你的用户ID: ${state.userId.slice(-4)}`;
        console.log('User ID displayed:', state.userId.slice(-4));
    } else {
        console.error('userRole element not found');
    }

    const userList = document.getElementById('userList');
    if (userList) {
        userList.innerHTML = ''; // 清空现有内容
        let existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        existingUsers.forEach(userId => {
            const userImage = getRandomImage();
            const isSelf = userId === state.userId;
            userList.innerHTML += `
                <div class="user-item ${isSelf ? 'self' : ''}">
                    <div class="user-image" style="background-image: url('${userImage}');"></div>
                    <button onclick="${isSelf ? '' : `selectUser('${userId}')`}">玩家${userId.slice(-4)}</button>
                </div>
            `;
        });
        console.log('User list updated with', existingUsers.length, 'users');
    } else {
        console.error('userList element not found');
    }
}

// 刷新用户列表
function refreshUsers() {
    console.log('Refreshing user list');
    updatePage2(); // 重新加载用户列表
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

// 选择用户并进行匹配
function selectUser(targetUserId) {
    if (targetUserId === state.userId) return; // 不能选择自己
    showPopup(`
        <h2>与 玩家${targetUserId.slice(-4)} 匹配？</h2>
        <button onclick="match('${targetUserId}')">确认匹配</button>
        <button onclick="closePopup()">取消</button>
    `);
}

// 匹配逻辑
function match(targetUserId) {
    state.game.hostReady = true;
    localStorage.setItem('userRole_' + state.userId, 'host');
    localStorage.setItem('userRole_' + targetUserId, 'guest');
    showPopup('<h2>等待对方确认...</h2>');
    console.log(`${state.userId.slice(-4)} matched with ${targetUserId.slice(-4)}`);
    setTimeout(() => {
        if (!state.game.guestReady) {
            state.game.guestReady = true; // 模拟对方准备
            console.log(`${targetUserId.slice(-4)} simulated as ready`);
        }
        if (state.game.hostReady && state.game.guestReady) {
            closePopup();
            showPage(3);
            // 通知对方进入第三页（模拟）
            if (localStorage.getItem('userRole_' + targetUserId) === 'guest') {
                showPage(3);
            }
        }
    }, 2000); // 2秒后模拟匹配完成
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
let currentNumber = [];
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
    state.game = {
        hostReady: false,
        guestReady: false,
        digits: 0,
        targetNumber: [],
        guessHistory: [],
        guessNumber: [],
        penColor: 'black'
    };
    currentNumber = [];
    localStorage.clear();
    closePopup();
    showPage(1);
    location.reload(); // 重新加载页面
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
    const ctx = canvas?.getContext('2d');
    if (ctx) {
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
    } else {
        console.error('Canvas context not available');
    }
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
        ctx.clearRect(0, 0, canvas.width, height);
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