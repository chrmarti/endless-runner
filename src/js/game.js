let canvas, ctx;
let score = 0;
let isGameOver = false;
let characterPosition = 1; // 0: left lane, 1: middle lane, 2: right lane
const LANE_WIDTH = 100;
const CHARACTER_HEIGHT = 60;
const CHARACTER_WIDTH = 30;

function initializeCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Add window resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function drawRunner() {
    const centerX = canvas.width / 2;
    const y = canvas.height - 100; // Fixed Y position near bottom
    const x = centerX + (characterPosition - 1) * LANE_WIDTH;

    // Draw runner
    ctx.fillStyle = '#333';
    
    // Body
    ctx.fillRect(x - CHARACTER_WIDTH/2, y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
    
    // Head
    ctx.beginPath();
    ctx.arc(x, y - CHARACTER_HEIGHT - 15, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Legs in running position (alternating)
    const time = Date.now() / 200; // Controls leg animation speed
    const legSpread = Math.sin(time) * 15;
    
    ctx.beginPath();
    ctx.moveTo(x, y - CHARACTER_HEIGHT + 10);
    ctx.lineTo(x - legSpread, y);
    ctx.lineTo(x + legSpread, y);
    ctx.closePath();
    ctx.fill();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function startGame() {
    initializeCanvas();
    gameLoop();
}

function gameLoop() {
    if (!isGameOver) {
        clearCanvas();
        drawRunner();
        updateGame();
        requestAnimationFrame(gameLoop);
    }
}

function jump() {
    // Logic for jumping over obstacles
}

function slide() {
    // Logic for sliding under barriers
}

function switchLane(direction) {
    if (direction === 'left' && characterPosition > 0) {
        characterPosition--;
    } else if (direction === 'right' && characterPosition < 2) {
        characterPosition++;
    }
}

function collectCoins() {
    // Logic for collecting coins
}

function updateScore(points) {
    score += points;
    // Update score display
}

// Event listeners for swipe gestures
document.addEventListener('swipeleft', () => switchLane('left'));
document.addEventListener('swiperight', () => switchLane('right'));
document.addEventListener('swipeup', jump);
document.addEventListener('swipedown', slide);