// 全局状态对象，管理页面和游戏状态
let state = {
    currentPage: 1,
    userRole: null,
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
    state.userRole = localStorage.getItem('userRole') || (Math.random() < 0.5 ? 'host' : 'guest');
    localStorage.setItem('userRole', state.userRole);
    console.log('User role initialized:', state.userRole);
    if (state.userRole === 'guest') {
        showPage(2); // 房客直接进入等待页面
    }
}

// 显示指定页面的函数，包含错误处理
function showPage(pageNum) {
    try {
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
            page.style.opacity = '0';
        });

        const pageId = `page${pageNum}${state.userRole === 'guest' && pageNum === 2 ? '-waiting' : ''}`;
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
}

// 更新第二页内容
function updatePage2() {
    const userRoleDisplay = document.getElementById('userRole');
    if (userRoleDisplay) {
        userRoleDisplay.textContent = `你的角色是：${state.userRole === 'host' ? '房主' : '房客'}`;
        console.log('User role displayed:', userRoleDisplay.textContent);
    } else {
        console.error('userRole element not found');
    }

    if (state.userRole === 'host') {
        const userList = document.getElementById('userList');
        if (userList) {
            userList.innerHTML = `
                <button onclick="selectUser('玩家A')">玩家A</button>
                <button onclick="selectUser('玩家B')">玩家B</button>
            `;
            console.log('User list updated for host');
            // 模拟房客的存在，自动触发准备逻辑
            setTimeout(() => simulateGuestReady(), 2000); // 2秒后模拟房客准备
        } else {
            console.error('userList element not found');
        }
    } else if (state.userRole === 'guest') {
        showPage(2); // 确保房客进入等待页面
    }
}

// 模拟房客准备
function simulateGuestReady() {
    if (state.userRole === 'host' && !state.game.guestReady) {
        state.game.guestReady = true;
        console.log('Simulated guest ready');
        if (state.game.hostReady) {
            showPage(3);
        }
    }
}

// 选择用户并显示准备弹窗
function selectUser(user) {
    state.game.hostReady = false;
    state.game.guestReady = false;
    showPopup(`
        <h2>准备好了吗？与 ${user} 配对</h2>
        <button onclick="ready(true, '${user}')">准备好了</button>
        <button onclick="ready(false, '${user}')">再等一会儿</button>
    `);
}

// 准备逻辑
function ready(isReady, user) {
    if (isReady) {
        state.game.hostReady = true;
        showPopup('<h2>等待对方准备...</h2>');
        console.log('Host ready, waiting for guest');
        setTimeout(() => {
            if (!state.game.guestReady) {
                state.game.guestReady = true; // 模拟房客准备
                console.log('Guest simulated as ready');
            }
            if (state.game.hostReady && state.game.guestReady) {
                closePopup();
                showPage(3);
            }
        }, 2000); // 2秒后模拟准备完成
    } else {
        closePopup();
        showPage(2);
        updatePage2();
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
    closePopup();
    showPage(1);
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