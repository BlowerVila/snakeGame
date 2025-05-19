import {
  checkWallCollision,
  checkSelfCollision,
//   checkEnemyBitePlayer
} from './src/collision.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");

const tileSize = 20;
const tileCount = canvas.width / tileSize;
let snake, direction, nextDirection, food, score, bestScore;
let gameInterval = null;
let isGameRunning = false;
let showYouLabel = true;  // YOU 提示字

// 敵人蛇變數
let enemySnake, enemyDirection; 

const DEBUG = true; // 或 false 發布時關掉


// 初始化
function initGame() {
    snake = [
        { x: 3, y: tileCount - 3 },
        { x: 2, y: tileCount - 3 },
        { x: 1, y: tileCount - 3 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = spawnFood();
    score = 0;

    // 敵人蛇初始化（起始位置和方向）
    enemySnake = [
        { x: tileCount - 3, y: 2 },
        { x: tileCount - 2, y: 2 },
        { x: tileCount - 1, y: 2 }
    ];
    enemyDirection = { x: 0, y: 1 };


    showYouLabel = true;
    setTimeout(() => {
        showYouLabel = false;
    }, 1000);


    updateScore();
    draw();
}

// 開始遊戲
function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    overlay.style.display = "none";
    gameInterval = setInterval(gameLoop, 150);

    restart_btn.style.display = "none";
}

function gameLoop() {
    update();
    draw();
}

function update() {
    direction = nextDirection;
    const head = {
        x: (snake[0].x + direction.x + tileCount) % tileCount,
        y: (snake[0].y + direction.y + tileCount) % tileCount
    };

    // 判斷撞牆或自撞
    if (
        checkWallCollision(head, tileCount) ||
        checkSelfCollision(head, snake)
    ) {
        gameOver();
        return;
    }

    snake.unshift(head);

    const ateFood = head.x === food.x && head.y === food.y;
    if (ateFood) {
        score++;
        // webGL 特效嵌入，與 webglEffect.js 檔案有關
        triggerWebGLEffect(food.x * tileSize, food.y * tileSize);

        food = spawnFood();
        updateScore();
    } else {
        snake.pop();
    }

    // 敵人蛇移動邏輯
    moveEnemySnake();
    // 被敵人咬判定
    checkEnemyHitsPlayer();

    if (DEBUG) {
        console.log("Snake head:", head);
        console.log("Enemy head:", enemySnake[0]);
    }
}

function draw() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#333";
    for (let i = 0; i < tileCount; i++) {
       ctx.beginPath();
       ctx.moveTo(i * tileSize, 0);
       ctx.lineTo(i * tileSize, canvas.height);
       ctx.stroke();

       ctx.beginPath();
       ctx.moveTo(0, i * tileSize);
       ctx.lineTo(canvas.width, i * tileSize);
       ctx.stroke();
    }

    // 繪製蛇 - 漸層
    // 莫名其妙配出了一個好看的顏色條，主要控制 intensity 的 floor 內第一個數字（默認250）
    snake.forEach((part, i) => {
        const gradient = 255 - i * 10; // 頭亮尾暗
        const intensity = Math.floor(250 - (155 * (i / snake.length)));
        ctx.fillStyle = `rgb(100, ${gradient}, ${intensity})`;
        ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    });
    // 繪製敵人蛇 - 紅色
    enemySnake.forEach((part, i) => {
        const intensity = Math.floor(200 - (120 * (i / enemySnake.length)));
        ctx.fillStyle = `rgb(255, ${intensity}, ${intensity})`;
        ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    });



    // Draw food
    ctx.fillStyle = "#f2920c";  // 食物顏色
    ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);

    // 畫出提示字
    if (showYouLabel) {
        const head = snake[0];
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px "Underdog", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('(YOU)', head.x * tileSize + tileSize / 2, head.y * tileSize - 5);
    }

}

function spawnFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}

function updateScore() {
    document.getElementById("current-score").textContent = score;
    bestScore = Math.max(score, parseInt(localStorage.getItem("bestScore") || "0"));
    localStorage.setItem("bestScore", bestScore);
    document.getElementById("best-score").textContent = bestScore;
}

// 遊戲結束
function gameOver() {
    clearInterval(gameInterval);
    isGameRunning = false;
    overlay.innerHTML = `
        <h1 style="line-height:0.5rem; font-size: 50px; margin-top: 60px;">Game Over</h1>
        <p style="font-size: 20px; font-weight: 400; line-height:0.5rem;">Score: ${score}</p>
        <button id="restart_btn" style="display: inline-block; margin-top:50px">Restart</button><br>
        <p style="font-size: 10px; font-weight: 400; margin-top: -15px; letter-spacing:0.1rem;">Or press any key to restart<p>`;
    overlay.style.display = "flex";

    // 新增按鈕在遊戲結束時
    const restart_btn = document.getElementById("restart_btn");
    if(restart_btn) console.log("已抓到按鈕");
    restart_btn.onclick = function(){
        initGame();
        startGame();
        console.log("按下按鈕");
    }; 
   
}



// ------ 敵人蛇 -------
function moveEnemySnake() {
    // 讓敵人偶爾改變方向
    if (Math.random() < 0.2) {
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        // 選一個與目前方向不同的新方向
        const newDirs = directions.filter(dir =>
            !(dir.x === -enemyDirection.x && dir.y === -enemyDirection.y)
        );

        enemyDirection = newDirs[Math.floor(Math.random() * newDirs.length)];
    }

    const head = {
        x: (enemySnake[0].x + enemyDirection.x + tileCount) % tileCount,
        y: (enemySnake[0].y + enemyDirection.y + tileCount) % tileCount
    };

    enemySnake.unshift(head);
    enemySnake.pop(); // 長度固定
}

// 玩家被敵人咬判定
function checkEnemyHitsPlayer() {
    const enemyHead = enemySnake[0];
    for (let i = 0; i < snake.length; i++) {
        if (enemyHead.x === snake[i].x && enemyHead.y === snake[i].y) {
            gameOver();
            break;
        }
    }
}



// ------ 輸入處理 -------
document.addEventListener("keydown", (e) => {
    if (!isGameRunning) {
        initGame();
        startGame();
        return;
    }
    const key = e.key;
    if (key === "ArrowUp" && direction.y === 0) nextDirection = { x: 0, y: -1 };
    if (key === "ArrowDown" && direction.y === 0) nextDirection = { x: 0, y: 1 };
    if (key === "ArrowLeft" && direction.x === 0) nextDirection = { x: -1, y: 0 };
    if (key === "ArrowRight" && direction.x === 0) nextDirection = { x: 1, y: 0 };
});

// 初始分數與畫面
bestScore = parseInt(localStorage.getItem("bestScore")) || 0;
document.getElementById("best-score").textContent = bestScore;
initGame();
