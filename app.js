// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase 초기화 (너의 config로 교체)
const firebaseConfig = {
  apiKey: "AIzaSyDcNjOTqh2EtqSxcoYGvUmWrgM7oogI6h4",
  authDomain: "wntlrtlr-c503b.firebaseapp.com",
  projectId: "wntlrtlr-c503b",
  storageBucket: "wntlrtlr-c503b.appspot.com",
  messagingSenderId: "597732036723",
  appId: "1:597732036723:web:94ce738bbb4ca42f8d1a06",
  measurementId: "G-JEZQZRR28X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 사용자 목록 및 관리자 이메일 ---
const adminEmail = "jjh@51.com";
const adminPassword = "123456";
const normalUsers = [];
for(let i=5101; i<=5123; i++) {
  if(i !== 5110 && i !== 5120) normalUsers.push(i + "@51.com"); // 20번은 없음
}
const normalPassword = "123456";

// --- DOM 요소 ---
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');
const tradeSection = document.getElementById('tradeSection');
const adminPanel = document.getElementById('adminPanel');
const withdrawalList = document.getElementById('withdrawalList');
const loanList = document.getElementById('loanList');
const seedUserEmail = document.getElementById('seedUserEmail');
const seedAmount = document.getElementById('seedAmount');
const addSeedMoneyBtn = document.getElementById('addSeedMoneyBtn');
const stockSelect = document.getElementById('stockSelect');
const stockAmount = document.getElementById('stockAmount');
const tradeStatus = document.getElementById('tradeStatus');
const logoutBtn = document.getElementById('logoutBtn');

// 로그인 함수 (회원가입 없이)
async function fakeLogin(email, password) {
  if(email === adminEmail && password === adminPassword) {
    return { email, role: 'admin' };
  }
  if(normalUsers.includes(email) && password === normalPassword) {
    return { email, role: 'user' };
  }
  throw new Error('아이디 또는 비밀번호가 틀렸습니다.');
}

// Firestore에 유저 데이터 없으면 초기화
async function initUserData(email) {
  const userDoc = doc(db, "users", email);
  const userSnap = await getDoc(userDoc);
  if(!userSnap.exists()) {
    await setDoc(userDoc, { cash: 10000000, stocks: {} });
  }
}

// 로그인 버튼 이벤트
loginBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  loginStatus.textContent = "로그인 시도 중...";
  try {
    const user = await fakeLogin(email, password);
    await initUserData(email);
    loginStatus.textContent = `${user.email} 님 환영합니다! 역할: ${user.role}`;
    showUIByRole(user);
  } catch(e) {
    loginStatus.textContent = e.message;
  }
};

// 역할별 UI 처리
function showUIByRole(user) {
  loginBtn.disabled = true;
  emailInput.disabled = true;
  passwordInput.disabled = true;

  tradeSection.style.display = "block";

  if(user.role === "admin") {
    adminPanel.style.display = "block";
    loadWithdrawalRequests();
    loadLoanRequests();
  } else {
    adminPanel.style.display = "none";
  }

  // 로그아웃 버튼 보이기
  logoutBtn.style.display = "inline-block";
  logoutBtn.onclick = () => {
    location.reload();
  };
}

// 출금 신청 내역 불러오기
async function loadWithdrawalRequests() {
  withdrawalList.textContent = "로딩 중...";
  const q = query(collection(db, "withdrawals"), where("userEmail", ">=", "5101@51.com"), where("userEmail", "<=", "5123@51.com"));
  const querySnapshot = await getDocs(q);

  if(querySnapshot.empty) {
    withdrawalList.textContent = "출금 신청 내역이 없습니다.";
    return;
  }
  withdrawalList.innerHTML = "";
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.textContent = `${data.userEmail} 출금 요청: ${data.amount}원, 상태: ${data.status}`;
    withdrawalList.appendChild(div);
  });
}

// 대출 신청 내역 불러오기
async function loadLoanRequests() {
  loanList.textContent = "로딩 중...";
  const q = query(collection(db, "loans"), where("userEmail", ">=", "5101@51.com"), where("userEmail", "<=", "5123@51.com"));
  const querySnapshot = await getDocs(q);

  if(querySnapshot.empty) {
    loanList.textContent = "대출 신청 내역이 없습니다.";
    return;
  }
  loanList.innerHTML = "";
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.textContent = `${data.userEmail} 대출 요청: ${data.amount}원, 상태: ${data.status}`;
    loanList.appendChild(div);
  });
}

// 시드머니 추가
addSeedMoneyBtn.onclick = async () => {
  const targetEmail = seedUserEmail.value.trim();
  const amount = parseInt(seedAmount.value);
  if(!normalUsers.includes(targetEmail)) {
    alert("존재하지 않는 사용자 이메일입니다.");
    return;
  }
  if(isNaN(amount) || amount <= 0) {
    alert("올바른 금액을 입력하세요.");
    return;
  }
  const userDoc = doc(db, "users", targetEmail);
  await updateDoc(userDoc, { cash: increment(amount) });
  alert(`${targetEmail} 님에게 ${amount}원 시드머니 추가 완료!`);
  seedUserEmail.value = "";
  seedAmount.value = "";
};

// 주식 가격 (예시, 실제 API 연동은 추가 필요)
const priceHistory = {
  AAPL: [160, 161, 159, 162],
  INTC: [28, 29, 30, 29],
  AMD: [90, 91, 89, 92],
  NVDA: [420, 425, 415, 430],
  TSMC: [90, 92, 91, 93],
  MSFT: [300, 302, 299, 303]
};

function getLatestPrice(symbol) {
  const prices = priceHistory[symbol];
  return prices ? prices[prices.length - 1] : 0;
}

// 유저 데이터 가져오기
async function getUserData(email) {
  const userDoc = doc(db, "users", email);
  const userSnap = await getDoc(userDoc);
  if(userSnap.exists()) {
    return userSnap.data();
  } else {
    // 초기화
    await setDoc(userDoc, { cash: 10000000, stocks: {} });
    return { cash: 10000000, stocks: {} };
  }
}

// 매수
async function buyStock(email, symbol, amount, price) {
  amount = Math.floor(amount);
  if(amount <= 0) {
    tradeStatus.textContent = "수량을 올바르게 입력하세요.";
    return;
  }
  const userData = await getUserData(email);
  const cost = price * amount;
  if(userData.cash < cost) {
    tradeStatus.textContent = "현금이 부족합니다.";
    return;
  }
  const userDoc = doc(db, "users", email);
  const stockField = `stocks.${symbol}`;
  await updateDoc(userDoc, { cash: userData.cash - cost, [stockField]: increment(amount) });
  tradeStatus.textContent = `${symbol} ${amount}주 매수 완료!`;
}

// 매도
async function sellStock(email, symbol, amount, price) {
  amount = Math.floor(amount);
  if(amount <= 0) {
    tradeStatus.textContent = "수량을 올바르게 입력하세요.";
    return;
  }
  const userData = await getUserData(email);
  const stockCount = userData.stocks[symbol] || 0;
  if(stockCount < amount) {
    tradeStatus.textContent = "보유 주식이 부족합니다.";
    return;
  }
  const userDoc = doc(db, "users", email);
  const stockField = `stocks.${symbol}`;
  await updateDoc(userDoc, { cash: userData.cash + price * amount, [stockField]: stockCount - amount });
  tradeStatus.textContent = `${symbol} ${amount}주 매도 완료!`;
}

buyBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const symbol = stockSelect.value;
  const amount = Number(stockAmount.value);
  const price = getLatestPrice(symbol);
  tradeStatus.textContent = "매수 처리 중...";
  await buyStock(email, symbol, amount, price);
};

sellBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const symbol = stockSelect.value;
  const amount = Number(stockAmount.value);
  const price = getLatestPrice(symbol);
  tradeStatus.textContent = "매도 처리 중...";
  await sellStock(email, symbol, amount, price);
};
