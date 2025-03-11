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

// 用户和房间设置
const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
const roomId = "bpmf";

// 进入房间
const roomRef = ref(database, `rooms/${roomId}/users/${userId}`);
set(roomRef, {
  id: userId,
  username: `玩家${userId.slice(-4)}`
}).then(() => {
  console.log(`用户 ${userId} 已加入房间 ${roomId}`);
});
onDisconnect(roomRef).remove();

// 监听用户列表变化
const usersRef = ref(database, `rooms/${roomId}/users`);
onValue(usersRef, (snapshot) => {
  const users = snapshot.val();
  updateUserList(users);
});

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

// 刷新按钮
document.getElementById('refreshButton').addEventListener('click', () => {
  const usersRef = ref(database, `rooms/${roomId}/users`);
  onValue(usersRef, (snapshot) => {
    const users = snapshot.val();
    updateUserList(users);
  }, { onlyOnce: true });
});