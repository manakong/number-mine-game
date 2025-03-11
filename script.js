// 全局状态对象，管理页面和游戏状态
let state = {
    currentPage: 1, // 默认显示第一页
    userRole: null, // 用户角色：host 或 guest
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

// 在页面加载时显示第一页，确保初始页面可见
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing page 1');
    showPage(1); // 初始化显示第一页
    initializeEventListeners(); // 设置事件监听器
});

// 显示指定页面的函数，包含错误处理
function showPage(pageNum) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });

    // 根据用户角色和页面编号确定目标页面
    const pageId = `page${pageNum}${state.userRole === 'guest' && pageNum === 2 ? '-waiting' : ''}`;
    const targetPage = document.getElementById(pageId);

    if (targetPage) {
        targetPage.style.display = 'block';
        state.currentPage = pageNum;
        console.log(`Switched to page: ${pageId}`);
    } else {
        console.error(`Page not found: ${pageId}`);
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    // 开始游戏按钮
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Start button clicked');
            showPage(2); // 切换到第二页
        });
    } else {
        console.error('Start button not found');
    }

    // 示例：其他按钮的事件监听（如需扩展）
    const hostButton = document.getElementById('hostButton');
    if (hostButton) {
        hostButton.addEventListener('click', () => {
            state.userRole = 'host';
            console.log('User selected role: host');
            showPage(2);
        });
    }

    const guestButton = document.getElementById('guestButton');
    if (guestButton) {
        guestButton.addEventListener('click', () => {
            state.userRole = 'guest';
            console.log('User selected role: guest');
            showPage(2);
        });
    }
}

// 示例：游戏逻辑函数（根据需要扩展）
function startGame() {
    if (state.userRole === 'host') {
        state.game.digits = parseInt(document.getElementById('digitsInput')?.value) || 4;
        state.game.targetNumber = generateTargetNumber(state.game.digits);
        console.log(`Game started by host. Target number: ${state.game.targetNumber}`);
    }
    // 其他游戏逻辑可在此扩展
}

// 生成随机目标数字（示例函数）
function generateTargetNumber(digits) {
    const numbers = [];
    while (numbers.length < digits) {
        const num = Math.floor(Math.random() * 10);
        if (!numbers.includes(num)) numbers.push(num);
    }
    return numbers;
}

// 调试用：检查状态
function logState() {
    console.log('Current state:', JSON.stringify(state, null, 2));
}

// 示例：页面加载后检查元素是否存在
console.log('Checking elements on load:', {
    startButton: !!document.getElementById('startButton'),
    page1: !!document.getElementById('page1'),
    page2: !!document.getElementById('page2')
});