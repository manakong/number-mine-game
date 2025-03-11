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

// 用户和房间状态
let userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
let roomId = "bpmf"; // 默认房间ID，可动态更改

// 进入房间
function enterRoom() {
  const roomRef = ref(database, `rooms/${roomId}/users/${userId}`);
  set(roomRef, {
    id: userId,
    username: `玩家${userId.slice(-4)}`
  }).then(() => {
    console.log(`用户 ${userId} 已加入房间 ${roomId}`);
    document.getElementById('userId').textContent = userId.slice(-4);
    document.getElementById('roomIdDisplay').textContent = roomId;
  }).catch((error) => {
    console.error("进入房间失败:", error);
  });
  onDisconnect(roomRef).remove();
}

// 监听用户列表变化
function listenUserList() {
  const usersRef = ref(database, `rooms/${roomId}/users`);
  onValue(usersRef, (snapshot) => {
    const users = snapshot.val();
    updateUserList(users);
  }, (error) => {
    console.error("监听用户列表失败:", error);
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
        const isSelf = uid === userId;
        userList.innerHTML += `
          <div class="user-item ${isSelf ? 'self' : ''}">
            <button>${user.username}</button>
          </div>
        `;
      }
    } else {
      userList.innerHTML = '<p>当前没有在线玩家</p>';
    }
  }
}

// 刷新用户列表
function refreshUsers() {
  listenUserList(); // 手动触发更新
}

// 更换房间
function changeRoom() {
  const newRoomId = prompt("请输入新的房间ID：") || `room_${Date.now().toString(36)}`;
  if (newRoomId !== roomId) {
    roomId = newRoomId;
    document.getElementById('roomIdDisplay').textContent = roomId;
    // 离开当前房间
    const oldRoomRef = ref(database, `rooms/${roomId}/users/${userId}`);
    remove(oldRoomRef);
    // 进入新房间
    enterRoom();
    listenUserList();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  enterRoom();
  listenUserList();

  // 绑定刷新按钮事件
  document.getElementById('refreshButton').addEventListener('click', refreshUsers);

  // 设置初始用户ID和房间ID显示
  document.getElementById('userId').textContent = userId.slice(-4);
  document.getElementById('roomIdDisplay').textContent = roomId;
});