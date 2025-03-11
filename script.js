let currentPage = 1;
let gameState = { hostReady: false, guestReady: false, digits: 0, targetNumber: [] };
let guessHistory = [];
let guessNumber = [];

function showPage(pageNum) {
    document.querySelectorAll('div[id^="page"]').forEach(page => page.style.display = 'none');
    document.getElementById(`page${pageNum}`).style.display = 'block';
    currentPage = pageNum;
}

document.getElementById('startButton').addEventListener('click', () => showPage(2));

function showPage2() {
    showPage(2);
    const userList = document.getElementById('userList');
    userList.innerHTML = '<button onclick="selectUser(\'玩家A\')">玩家A</button><button onclick="selectUser(\'玩家B\')">玩家B</button>';
}

function selectUser(user) {
    gameState.hostReady = false;
    gameState.guestReady = false;
    showPopup(`<h2>准备好了吗？</h2><button onclick="ready(true, '${user}')">准备好了</button><button onclick="ready(false, '${user}')">再等一会儿</button>`);
}

function ready(isReady, user) {
    if (isReady) {
        if (gameState.hostReady && gameState.guestReady) {
            closePopup();
            showPage(3);
        } else {
            gameState.hostReady = true;
            showPopup('<h2>等待对方准备...</h2>');
            setTimeout(() => {
                gameState.guestReady = true;
                closePopup();
                showPage(3);
            }, 1000); // 模拟对方准备
        }
    } else {
        closePopup();
        showPage(2);
    }
}

function confirmDigit() {
    gameState.digits = parseInt(document.getElementById('digitSelect').value);
    showPage(4);
    updateInputGrid();
}

function updateInputGrid() {
    const grid = document.getElementById('inputGrid');
    grid.innerHTML = '';
    for (let i = 0; i < gameState.digits; i++) {
        grid.innerHTML += `<div class="cell" id="cell-${i}"></div>`;
    }
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        keyboard.innerHTML += `<button onclick="addNumber(${i})">${i}</button>`;
    }
    keyboard.innerHTML += `<button onclick="deleteNumber()">删除</button><button onclick="clearInput()">清空</button>`;
}

let currentNumber = [];
function addNumber(num) {
    if (currentNumber.length < gameState.digits) {
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
    cells.forEach((cell, i) => cell.textContent = currentNumber[i] || '');
}

function confirmNumber() {
    if (currentNumber.length === gameState.digits) {
        gameState.targetNumber = [...currentNumber];
        showPopup(`<h2>是否确认让对方猜这个号码？</h2><p>${currentNumber.join('')}</p><button onclick="startGuess()">确认</button><button onclick="cancelConfirm()">取消</button>`);
    } else {
        alert('请填满所有格子！');
    }
}

function cancelConfirm() {
    closePopup();
}

function startGuess() {
    closePopup();
    showPage(5);
    updateTargetGrid();
    initCanvas();
}

function updateTargetGrid() {
    const grid = document.getElementById('targetGrid');
    grid.innerHTML = '';
    for (let i = 0; i < gameState.digits; i++) {
        grid.innerHTML += `<div class="cell">${gameState.targetNumber[i]}</div>`;
    }
}

function showGuessPopup() {
    guessNumber = [];
    showPopup(`
        <h2>输入你的猜测</h2>
        <div class="grid" id="guessGrid"></div>
        <div class="keyboard" id="guessKeyboard"></div>
        <button onclick="clearGuess()">清空</button>
        <button onclick="submitGuess()">确认</button>
    `);
    const grid = document.getElementById('guessGrid');
    for (let i = 0; i < gameState.digits; i++) {
        grid.innerHTML += `<div class="cell" id="guess-cell-${i}"></div>`;
    }
    const keyboard = document.getElementById('guessKeyboard');
    for (let i = 0; i <= 9; i++) {
        keyboard.innerHTML += `<button onclick="addGuess(${i})">${i}</button>`;
    }
    keyboard.innerHTML += `<button onclick="deleteGuess()">删除</button>`;
}

function addGuess(num) {
    if (guessNumber.length < gameState.digits) {
        guessNumber.push(num);
        updateGuessCells();
    }
}

function deleteGuess() {
    guessNumber.pop();
    updateGuessCells();
}

function clearGuess() {
    guessNumber = [];
    updateGuessCells();
}

function updateGuessCells() {
    const cells = document.querySelectorAll('#guessGrid .cell');
    cells.forEach((cell, i) => cell.textContent = guessNumber[i] || '');
}

function submitGuess() {
    if (guessNumber.length === gameState.digits) {
        const target = gameState.targetNumber;
        let hits = 0;
        for (let i = 0; i < gameState.digits; i++) {
            if (guessNumber[i] === target[i]) hits++;
        }
        guessHistory.push({ guess: guessNumber.join(''), hits });
        updateHistory();
        if (hits === gameState.digits) {
            document.getElementById('targetGrid').style.opacity = '1';
            document.body.innerHTML += `<h1>恭喜您猜对了！用了${guessHistory.length}次</h1>`;
        }
        document.getElementById('popup').innerHTML += `<p>命中：${hits}</p><button onclick="closePopup()">确认</button>`;
    }
}

function updateHistory() {
    const history = document.getElementById('history');
    history.innerHTML = '';
    guessHistory.forEach((item, index) => {
        history.innerHTML += `<p>${index + 1}. ${item.guess} - 命中: ${item.hits}</p>`;
    });
}

function showPopup(content) {
    document.getElementById('popup').style.display = 'block';
    document.getElementById('popup').innerHTML = content;
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('popup').innerHTML = '';
}

function initCanvas() {
    const canvas = document.getElementById('noteCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;

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