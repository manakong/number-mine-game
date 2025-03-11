// 第一页面跳转
document.getElementById('startButton').addEventListener('click', () => {
    showPage2();
});

// 页面 2：寻找好友（模拟用户列表）
function showPage2() {
    document.body.innerHTML = `
        <div class="container">
            <h1>寻找好友</h1>
            <div id="userList">
                <button onclick="selectUser('玩家A')">玩家A</button>
                <button onclick="selectUser('玩家B')">玩家B</button>
            </div>
        </div>
    `;
}

function selectUser(user) {
    // 模拟房主选择房客，弹出准备窗口
    showReadyPopup(user);
}

function showReadyPopup(user) {
    document.body.innerHTML += `
        <div class="popup" id="readyPopup">
            <h2>准备好了吗？</h2>
            <button onclick="ready(true, '${user}')">准备好了</button>
            <button onclick="ready(false, '${user}')">再等一会儿</button>
        </div>
    `;
}

function ready(isReady, user) {
    const popup = document.getElementById('readyPopup');
    popup.remove();
    if (isReady) {
        // 模拟双方准备好，房主进入第三页面
        showPage3();
    } else {
        showPage2();
    }
}

// 页面 3：选择位数
function showPage3() {
    document.body.innerHTML = `
        <div class="container">
            <h1>选择数字位数</h1>
            <select id="digitSelect">
                ${Array.from({ length: 9 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
            </select>
            <button onclick="confirmDigit()">确认</button>
        </div>
    `;
}

function confirmDigit() {
    const digits = parseInt(document.getElementById('digitSelect').value);
    showPage4(digits);
}

// 页面 4：输入数字
function showPage4(digits) {
    document.body.innerHTML = `
        <div class="container">
            <h1>输入你的数字</h1>
            <div class="grid" id="inputGrid"></div>
            <div class="keyboard" id="keyboard"></div>
            <button onclick="clearInput()">清空</button>
            <button onclick="confirmNumber(${digits})">确认</button>
        </div>
    `;
    const grid = document.getElementById('inputGrid');
    for (let i = 0; i < digits; i++) {
        grid.innerHTML += `<div class="cell" id="cell-${i}"></div>`;
    }
    const keyboard = document.getElementById('keyboard');
    for (let i = 0; i <= 9; i++) {
        keyboard.innerHTML += `<button onclick="addNumber(${i})">${i}</button>`;
    }
    keyboard.innerHTML += `<button onclick="deleteNumber()">删除</button>`;
}

let currentNumber = [];
function addNumber(num) {
    if (currentNumber.length < document.querySelectorAll('.cell').length) {
        currentNumber.push(num);
        updateGrid();
    }
}

function deleteNumber() {
    currentNumber.pop();
    updateGrid();
}

function clearInput() {
    currentNumber = [];
    updateGrid();
}

function updateGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
        cell.textContent = currentNumber[i] || '';
    });
}

function confirmNumber(digits) {
    if (currentNumber.length === digits) {
        showConfirmPopup(currentNumber);
    } else {
        alert('请填满所有格子！');
    }
}

function showConfirmPopup(number) {
    document.body.innerHTML += `
        <div class="popup" id="confirmPopup">
            <h2>是否确认让对方猜这个号码？</h2>
            <p>${number.join('')}</p>
            <button onclick="startGuess('${number.join('')}')">确认</button>
            <button onclick="cancelConfirm(${digits})">取消</button>
        </div>
    `;
}

function cancelConfirm(digits) {
    document.getElementById('confirmPopup').remove();
    showPage4(digits);
}

// 页面 5：猜数字
function startGuess(targetNumber) {
    document.body.innerHTML = `
        <div class="container" style="display: grid; grid-template-rows: 20% 80%; grid-template-columns: 60% 40%;">
            <div class="grid" id="targetGrid" style="background: gray;"></div>
            <button onclick="showGuessPopup(${targetNumber.length})">猜数字</button>
            <div id="history"></div>
            <canvas id="noteCanvas" width="200" height="200"></canvas>
        </div>
    `;
    const grid = document.getElementById('targetGrid');
    for (let i = 0; i < targetNumber.length; i++) {
        grid.innerHTML += `<div class="cell">${targetNumber[i]}</div>`;
    }
    initCanvas();
}

function showGuessPopup(digits) {
    document.body.innerHTML += `
        <div class="popup" id="guessPopup">
            <h2>输入你的猜测</h2>
            <div class="grid" id="guessGrid"></div>
            <div class="keyboard" id="guessKeyboard"></div>
            <button onclick="clearGuess()">清空</button>
            <button onclick="submitGuess(${digits})">确认</button>
        </div>
    `;
    const grid = document.getElementById('guessGrid');
    for (let i = 0; i < digits; i++) {
        grid.innerHTML += `<div class="cell" id="guess-cell-${i}"></div>`;
    }
    const keyboard = document.getElementById('guessKeyboard');
    for (let i = 0; i <= 9; i++) {
        keyboard.innerHTML += `<button onclick="addGuess(${i})">${i}</button>`;
    }
    keyboard.innerHTML += `<button onclick="deleteGuess()">删除</button>`;
}

let guessNumber = [];
function addGuess(num) {
    if (guessNumber.length < document.querySelectorAll('#guessGrid .cell').length) {
        guessNumber.push(num);
        updateGuessGrid();
    }
}

function deleteGuess() {
    guessNumber.pop();
    updateGuessGrid();
}

function clearGuess() {
    guessNumber = [];
    updateGuessGrid();
}

function updateGuessGrid() {
    const cells = document.querySelectorAll('#guessGrid .cell');
    cells.forEach((cell, i) => {
        cell.textContent = guessNumber[i] || '';
    });
}

function submitGuess(digits) {
    if (guessNumber.length === digits) {
        const target = document.querySelectorAll('#targetGrid .cell').map(cell => parseInt(cell.textContent));
        let hits = 0;
        for (let i = 0; i < digits; i++) {
            if (guessNumber[i] === target[i]) hits++;
        }
        document.getElementById('guessPopup').innerHTML += `
            <p>命中：${hits}</p>
            <button onclick="closeGuessPopup('${guessNumber.join('')}', ${hits}, ${digits})">确认</button>
        `;
        if (hits === digits) {
            document.getElementById('targetGrid').style.opacity = '1';
            document.body.innerHTML += `<h1>恭喜您猜对了！用了${document.getElementById('history').children.length + 1}次</h1>`;
        }
    }
}

function closeGuessPopup(guess, hits, digits) {
    document.getElementById('guessPopup').remove();
    const history = document.getElementById('history');
    history.innerHTML += `<p>${history.children.length + 1}. ${guess} - 命中: ${hits}</p>`;
    guessNumber = [];
}

// 画笔功能
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