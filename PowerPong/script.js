// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game settings
const paddleWidth = 15;
const paddleHeight = 100;
const paddleSpeed = 7;
const winningScore = 5;

const initialBallSpeedX = 5;
const initialBallSpeedY = 3;
const speedIncreaseInterval = 8000;
const speedIncreaseAmount = 1.12;
const maxBallSpeed = 13;

// Power-up settings
const powerUpSize = 24;
const powerUpSpawnInterval = 7000;
const powerUpDuration = 7000;

// Game state
let gameState = "start";
let winnerText = "";
let lastScoreTime = Date.now();
let speedMessage = "";
let speedMessageTime = 0;

let lastPowerUpSpawnTime = Date.now();
let activePowerUp = null;
let powerUpMessage = "";
let powerUpMessageTime = 0;
let lastTouchedPlayer = null;

// Score delay state
let isWaitingAfterScore = false;
let nextRoundStartTime = 0;
let countdownText = "";

// Keyboard state
const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};

// Game objects
const player1 = {
    x: 30,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    originalHeight: paddleHeight,
    score: 0,
    effectEndTime: 0
};

const player2 = {
    x: canvas.width - 30 - paddleWidth,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    originalHeight: paddleHeight,
    score: 0,
    effectEndTime: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 12,
    speedX: initialBallSpeedX,
    speedY: initialBallSpeedY,
    nextDirection: 1,
    nextSpeedY: initialBallSpeedY
};

// Keyboard event listeners
document.addEventListener("keydown", function(event) {
    if (event.key === "w" || event.key === "W") {
        keys.w = true;
    }

    if (event.key === "s" || event.key === "S") {
        keys.s = true;
    }

    if (event.key === "ArrowUp") {
        keys.ArrowUp = true;
    }

    if (event.key === "ArrowDown") {
        keys.ArrowDown = true;
    }

    if (event.code === "Space" && gameState === "start") {
        gameState = "playing";
        lastScoreTime = Date.now();
        lastPowerUpSpawnTime = Date.now();
    }

    if ((event.key === "r" || event.key === "R") && gameState === "gameOver") {
        restartGame();
    }
});

document.addEventListener("keyup", function(event) {
    if (event.key === "w" || event.key === "W") {
        keys.w = false;
    }

    if (event.key === "s" || event.key === "S") {
        keys.s = false;
    }

    if (event.key === "ArrowUp") {
        keys.ArrowUp = false;
    }

    if (event.key === "ArrowDown") {
        keys.ArrowDown = false;
    }
});

// Draw rectangle
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

// Draw circle
function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Draw text
function drawText(text, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}

// Draw center dashed line
function drawCenterLine() {
    ctx.fillStyle = "white";

    for (let y = 0; y < canvas.height; y += 25) {
        ctx.fillRect(canvas.width / 2 - 2, y, 4, 15);
    }
}

// Update paddle positions
function updatePaddles() {
    if (keys.w && player1.y > 0) {
        player1.y -= paddleSpeed;
    }

    if (keys.s && player1.y + player1.height < canvas.height) {
        player1.y += paddleSpeed;
    }

    if (keys.ArrowUp && player2.y > 0) {
        player2.y -= paddleSpeed;
    }

    if (keys.ArrowDown && player2.y + player2.height < canvas.height) {
        player2.y += paddleSpeed;
    }
}

// Check collision between ball and paddle
function checkPaddleCollision(paddle) {
    return (
        ball.x - ball.size < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y - ball.size < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y
    );
}

// Check collision between ball and power-up
function checkPowerUpCollision() {
    if (activePowerUp === null) {
        return false;
    }

    return (
        ball.x + ball.size > activePowerUp.x &&
        ball.x - ball.size < activePowerUp.x + activePowerUp.size &&
        ball.y + ball.size > activePowerUp.y &&
        ball.y - ball.size < activePowerUp.y + activePowerUp.size
    );
}

// Reset ball to center and stop it
function resetBall(direction) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;

    ball.speedX = 0;
    ball.speedY = 0;

    ball.nextDirection = direction;
    ball.nextSpeedY = Math.random() > 0.5 ? initialBallSpeedY : -initialBallSpeedY;

    lastScoreTime = Date.now();
    activePowerUp = null;
}

// Start the ball after delay
function startNextRound() {
    ball.speedX = initialBallSpeedX * ball.nextDirection;
    ball.speedY = ball.nextSpeedY;

    isWaitingAfterScore = false;
    countdownText = "";
    lastScoreTime = Date.now();
    lastPowerUpSpawnTime = Date.now();
}

// Start 3-second delay after a score
function startScoreDelay(direction) {
    resetBall(direction);

    isWaitingAfterScore = true;
    nextRoundStartTime = Date.now() + 3000;
}

// Update countdown after score
function updateScoreDelay() {
    if (!isWaitingAfterScore) {
        return;
    }

    const remainingTime = Math.ceil((nextRoundStartTime - Date.now()) / 1000);

    if (remainingTime > 0) {
        countdownText = "Next round starts in " + remainingTime;
    } else {
        startNextRound();
    }
}

// Reset players and ball
function resetPositions() {
    player1.height = paddleHeight;
    player2.height = paddleHeight;
    player1.effectEndTime = 0;
    player2.effectEndTime = 0;

    player1.y = canvas.height / 2 - player1.height / 2;
    player2.y = canvas.height / 2 - player2.height / 2;

    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = initialBallSpeedX * (Math.random() > 0.5 ? 1 : -1);
    ball.speedY = Math.random() > 0.5 ? initialBallSpeedY : -initialBallSpeedY;
}

// Restart game
function restartGame() {
    player1.score = 0;
    player2.score = 0;

    winnerText = "";
    speedMessage = "";
    speedMessageTime = 0;
    powerUpMessage = "";
    powerUpMessageTime = 0;
    activePowerUp = null;
    lastTouchedPlayer = null;

    isWaitingAfterScore = false;
    nextRoundStartTime = 0;
    countdownText = "";

    lastScoreTime = Date.now();
    lastPowerUpSpawnTime = Date.now();

    resetPositions();
    gameState = "start";
}

// Keep paddle inside canvas after size change
function fixPaddlePosition(paddle) {
    if (paddle.y < 0) {
        paddle.y = 0;
    }

    if (paddle.y + paddle.height > canvas.height) {
        paddle.y = canvas.height - paddle.height;
    }
}

// Handle paddle collision
function handlePaddleCollision(paddle, direction, playerNumber) {
    if (checkPaddleCollision(paddle)) {
        ball.speedX = Math.abs(ball.speedX) * direction;

        const paddleCenter = paddle.y + paddle.height / 2;
        const hitPosition = ball.y - paddleCenter;

        ball.speedY = hitPosition * 0.15;

        lastTouchedPlayer = playerNumber;
    }
}

// Check winner
function checkWinner() {
    if (player1.score >= winningScore) {
        winnerText = "Player 1 Wins!";
        gameState = "gameOver";
    }

    if (player2.score >= winningScore) {
        winnerText = "Player 2 Wins!";
        gameState = "gameOver";
    }
}

// Increase ball speed if nobody scores
function increaseBallSpeedOverTime() {
    const currentTime = Date.now();

    if (currentTime - lastScoreTime >= speedIncreaseInterval) {
        const currentSpeedX = Math.abs(ball.speedX);

        if (currentSpeedX < maxBallSpeed) {
            ball.speedX *= speedIncreaseAmount;
            ball.speedY *= speedIncreaseAmount;

            speedMessage = "Ball Speed Increased!";
            speedMessageTime = Date.now();
        }

        lastScoreTime = Date.now();
    }
}

// Create a random power-up
function spawnPowerUp() {
    const types = ["grow", "shrink", "speed"];
    const randomType = types[Math.floor(Math.random() * types.length)];

    let color = "#2ecc71";
    let label = "G";

    if (randomType === "shrink") {
        color = "#e74c3c";
        label = "S";
    }

    if (randomType === "speed") {
        color = "#f1c40f";
        label = "V";
    }

    activePowerUp = {
        x: Math.random() * (canvas.width - 240) + 120,
        y: Math.random() * (canvas.height - 160) + 80,
        size: powerUpSize,
        type: randomType,
        color: color,
        label: label
    };
}

// Update power-up spawning
function updatePowerUpSpawn() {
    const currentTime = Date.now();

    if (activePowerUp === null && currentTime - lastPowerUpSpawnTime >= powerUpSpawnInterval) {
        spawnPowerUp();
        lastPowerUpSpawnTime = Date.now();
    }
}

// Apply power-up effect
function applyPowerUp() {
    if (activePowerUp === null) {
        return;
    }

    if (lastTouchedPlayer === null) {
        powerUpMessage = "Power-up missed!";
        powerUpMessageTime = Date.now();
        activePowerUp = null;
        return;
    }

    const currentTime = Date.now();

    const currentPlayer = lastTouchedPlayer === 1 ? player1 : player2;
    const opponentPlayer = lastTouchedPlayer === 1 ? player2 : player1;

    if (activePowerUp.type === "grow") {
        currentPlayer.height = 140;
        currentPlayer.effectEndTime = currentTime + powerUpDuration;
        fixPaddlePosition(currentPlayer);

        powerUpMessage = `Player ${lastTouchedPlayer} Paddle Grows!`;
    }

    if (activePowerUp.type === "shrink") {
        opponentPlayer.height = 70;
        opponentPlayer.effectEndTime = currentTime + powerUpDuration;
        fixPaddlePosition(opponentPlayer);

        const opponentNumber = lastTouchedPlayer === 1 ? 2 : 1;
        powerUpMessage = `Player ${opponentNumber} Paddle Shrinks!`;
    }

    if (activePowerUp.type === "speed") {
        if (Math.abs(ball.speedX) < maxBallSpeed) {
            ball.speedX *= 1.18;
            ball.speedY *= 1.18;
        }

        powerUpMessage = "Speed Power-up Activated!";
    }

    powerUpMessageTime = Date.now();
    activePowerUp = null;
}

// Reset paddle effects after duration
function updatePaddleEffects() {
    const currentTime = Date.now();

    if (player1.effectEndTime !== 0 && currentTime > player1.effectEndTime) {
        player1.height = player1.originalHeight;
        player1.effectEndTime = 0;
        fixPaddlePosition(player1);
    }

    if (player2.effectEndTime !== 0 && currentTime > player2.effectEndTime) {
        player2.height = player2.originalHeight;
        player2.effectEndTime = 0;
        fixPaddlePosition(player2);
    }
}

// Update ball position
function updateBall() {
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.speedY *= -1;
    }

    handlePaddleCollision(player1, 1, 1);
    handlePaddleCollision(player2, -1, 2);

    if (checkPowerUpCollision()) {
        applyPowerUp();
    }

    if (ball.x + ball.size < 0) {
        player2.score++;
        checkWinner();

        if (gameState !== "gameOver") {
            startScoreDelay(-1);
        }
    }

    if (ball.x - ball.size > canvas.width) {
        player1.score++;
        checkWinner();

        if (gameState !== "gameOver") {
            startScoreDelay(1);
        }
    }
}

// Update all game logic
function updateGame() {
    if (gameState === "playing") {
        updatePaddles();

        if (isWaitingAfterScore) {
            updateScoreDelay();
        } else {
            updateBall();
            increaseBallSpeedOverTime();
            updatePowerUpSpawn();
        }

        updatePaddleEffects();
    }
}

// Draw active power-up
function drawPowerUp() {
    if (activePowerUp === null) {
        return;
    }

    drawRect(
        activePowerUp.x,
        activePowerUp.y,
        activePowerUp.size,
        activePowerUp.size,
        activePowerUp.color
    );

    drawText(
        activePowerUp.label,
        activePowerUp.x + activePowerUp.size / 2,
        activePowerUp.y + 18,
        16,
        "black"
    );
}

// Draw gameplay screen
function drawGameplay() {
    drawRect(0, 0, canvas.width, canvas.height, "#2c3e50");

    drawCenterLine();

    drawText(player1.score, canvas.width / 4, 70, 48, "white");
    drawText(player2.score, canvas.width * 3 / 4, 70, 48, "white");

    drawText("First to 5 Wins", canvas.width / 2, 30, 20, "white");

    drawText(
        "Ball Speed: " + Math.abs(ball.speedX).toFixed(1),
        canvas.width / 2,
        55,
        16,
        "#dddddd"
    );

    if (speedMessage !== "" && Date.now() - speedMessageTime < 1500) {
        drawText(speedMessage, canvas.width / 2, 95, 22, "#f1c40f");
    }

    if (powerUpMessage !== "" && Date.now() - powerUpMessageTime < 1800) {
        drawText(powerUpMessage, canvas.width / 2, 125, 22, "#2ecc71");
    }

    if (isWaitingAfterScore && countdownText !== "") {
        drawText(countdownText, canvas.width / 2, canvas.height / 2 - 40, 28, "#f1c40f");
    }

    drawPowerUp();

    drawRect(player1.x, player1.y, player1.width, player1.height, "white");
    drawRect(player2.x, player2.y, player2.width, player2.height, "white");

    drawCircle(ball.x, ball.y, ball.size, "white");

    drawText("G: Grow  |  S: Shrink  |  V: Speed", canvas.width / 2, canvas.height - 18, 16, "#dddddd");
}

// Draw start screen
function drawStartScreen() {
    drawRect(0, 0, canvas.width, canvas.height, "#101820");

    drawText("POWER PONG", canvas.width / 2, 135, 52, "white");
    drawText("A Dynamic Two-Player Pong Game", canvas.width / 2, 185, 24, "#dddddd");

    drawText("Player 1: W / S", canvas.width / 2, 255, 24, "white");
    drawText("Player 2: Arrow Up / Arrow Down", canvas.width / 2, 295, 24, "white");

    drawText("If nobody scores, the ball gets faster.", canvas.width / 2, 345, 22, "#f1c40f");
    drawText("Collect power-ups with the ball.", canvas.width / 2, 380, 22, "#2ecc71");

    drawText("G = Grow Paddle   S = Shrink Opponent   V = Speed Ball", canvas.width / 2, 420, 20, "#dddddd");

    drawText("Press SPACE to Start", canvas.width / 2, 480, 30, "white");
}

// Draw game over screen
function drawGameOverScreen() {
    drawRect(0, 0, canvas.width, canvas.height, "#101820");

    drawText("GAME OVER", canvas.width / 2, 180, 52, "white");
    drawText(winnerText, canvas.width / 2, 250, 34, "white");

    drawText(`Final Score: ${player1.score} - ${player2.score}`, canvas.width / 2, 310, 26, "#dddddd");
    drawText("Press R to Restart", canvas.width / 2, 390, 30, "white");
}

// Draw all game elements
function drawGame() {
    if (gameState === "start") {
        drawStartScreen();
    } else if (gameState === "playing") {
        drawGameplay();
    } else if (gameState === "gameOver") {
        drawGameOverScreen();
    }
}

// Game loop
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();