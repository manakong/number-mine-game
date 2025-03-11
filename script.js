// 全局状态
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

// 初始化用户角色
state.userRole = localStorage.getItem('userRole') || (Math.random() < 0.5 ? '房主' : '房客');
localStorage.setItem('userRole', state.userRole);

// 页面切换
function showPage(pageNum) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(`page${pageNum}${state.userRole === '房客' && pageNum === 2 ? '-waiting' : ''}`).style.display = 'block';
    state.currentPage = pageNum;
}

// 第一页面：开始游戏
document.getElementById('startButton').addEventListener('click', () => {
    showPage(2);
    updatePage2();
});

// 第二页面：寻找好友
function updatePage2() {
    const userRoleDisplay = document.getElementById('userRole');
    userRoleDisplay.textContent = `你的角色是：${state.userRole}`;
    
    if (state.userRole === '房主') {
        const userList = document.getElementById('userList');
        userList.innerHTML = `
            <button onclick="selectUser('玩家A')">玩家A</button>
            <button onclick="selectUser('玩家B')">玩家B</button>
        `;
    }
}

function selectUser(user) {
    state.game.hostReady = false;
    state.game.guestReady = false;
    showPopup(`
        <h2>准备好了吗？</h2>
        <button onclick="ready(true, '${user}')">准备好了</button>
        <button onclick="ready(false, '${user}')">再等一会儿</button>
    `);
}

function ready(isReady, user) {
    if (isReady) {
        if (state.game.hostReady && state.game.guestReady) {
            closePopup();
            showPage(3);
        } else {
            state.game.hostReady = true;
            showPopup('<h2>等待对方准备...</h2>');
            setTimeout(() => {
                state.game.guestReady = true;
                closePopup();
                showPage(3);
            }, 1000); // 模拟对方准备
        }
    } else {
        closePopup();
        showPage(2);
        updatePage2();
    }
}

// 第三页面：选择位数
function confirmDigit() {
    state.game.digits = parseInt(document.getElementById('digitSelect').value);
    showPage(4);
    updateInputGrid();
}

// 第四页面：输入数字
let currentNumber = [];
function updateInputGrid() {
    const grid = document.getElementById('inputGrid');
    grid.innerHTML = '';
    for (let i = 0; i < state.game.digits; i++) {
        grid.innerHTML += `<div class="cell" id="cell-${i}"></div>`;
    }
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        keyboard.innerHTML += `<button onclick="addNumber(${i})">${i}</button>`;
    }
    keyboard.innerHTML += `
        <button onclick="deleteNumber()">删除</button>
        <button onclick="clearInput()">清空</button>
    `;
}

function addNumber(num) {
    if (currentNumber.length < state.game.digits) {
        currentNumber.push(num);
        updateCells();
    }
}

function deleteNumber() {
    currentNumber.pop();
    updateCells();
}

function clearInput() {
    currentNumber = [];
    updateCells();
}

function updateCells() {
    const cells = document.querySelectorAll('#inputGrid .cell');
    cells.forEach((cell, i) => {
        cell.textContent = currentNumber[i] || '';
        cell.classList.toggle('filled', !!currentNumber[i]);
    });
}

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

function cancelConfirm() {
    closePopup();
}

// 第五页面：猜数字
function startGuess() {
    closePopup();
    showPage(5);
    updateTargetGrid();
    initCanvas();
}

function updateTargetGrid() {
    const grid = document.getElementById('targetGrid');
    grid.innerHTML = '';
    for (let i = 0; i < state.game.digits; i++) {
        grid.innerHTML += `<div class="cell">${state.game.targetNumber[i]}</div>`;
    }
}

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
    for (let i = 0; i < state.game.digits; i++) {
        grid.innerHTML += `<div class="cell" id="guess-cell-${i}"></div>`;
    }
    const keyboard = document.getElementById('guessKeyboard');
    for (let i = 0; i <= 9; i++) {
        keyboard.innerHTML += `<button onclick="addGuess(${i})">${i}</button>`;
    }
    keyboard.innerHTML += `<button onclick="deleteGuess()">删除</button>`;
}

function addGuess(num) {
    if (state.game.guessNumber.length < state.game.digits) {
        state.game.guessNumber.push(num);
        updateGuessCells();
    }
}

function deleteGuess() {
    state.game.guessNumber.pop();
    updateGuessCells();
}

function clearGuess() {
    state.game.guessNumber = [];
    updateGuessCells();
}

function updateGuessCells() {
    const cells = document.querySelectorAll('#guessGrid .cell');
    cells.forEach((cell, i) => {
        cell.textContent = state.game.guessNumber[i] || '';
        cell.classList.toggle('filled', !!state.game.guessNumber[i]);
    });
}

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
            targetGrid.style.opacity = '1';
            targetGrid.querySelectorAll('.cell').forEach(cell => cell.classList.add('correct'));
            showPopup(`
                <h2>恭喜您猜对了！</h2>
                <p>您用了 ${state.game.guessHistory.length} 次</p>
                <button onclick="resetGame()">再玩一次</button>
            `);
        } else {
            document.getElementById('popup').innerHTML += `
                <p>命中：${hits}</p>
                <button onclick="closePopup()">确认</button>
            `;
        }
    }
}

function updateHistory() {
    const history = document.getElementById('history');
    history.innerHTML = '';
    state.game.guessHistory.forEach((item, index) => {
        history.innerHTML += `<p>${index + 1}. ${item.guess} - 命中: ${item.hits}</p>`;
    });
    history.scrollTop = history.scrollHeight;
}

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
    popup.innerHTML = content;
    popup.style.display = 'block';
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
    popup.innerHTML = '';
}

// 画笔功能
function initCanvas() {
    const canvas = document.getElementById('noteCanvas');
    const ctx = canvas.getContext('2d');
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

function changePenColor(color) {
    state.game.penColor = color;
    const canvas = document.getElementById('noteCanvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
}

function clearCanvas() {
    const canvas = document.getElementById('noteCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}