let canvas, ctx;
let score = 0;
let isGameOver = false;
let characterPosition = 1; // 0: left lane, 1: middle lane, 2: right lane
let targetPosition = 1; // Target lane for smooth movement
let currentX = 0; // Current X position for smooth animation
const MOVEMENT_SPEED = 10; // Speed of lane switching
const LANE_WIDTH = 100;
const CHARACTER_HEIGHT = 60;
const CHARACTER_WIDTH = 30;

function initializeCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set initial currentX position
    currentX = canvas.width / 2;
    
    // Add window resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Update currentX on resize
        currentX = canvas.width / 2 + (targetPosition - 1) * LANE_WIDTH;
    });
}

function drawRunner() {
    const centerX = canvas.width / 2;
    const y = canvas.height - 100; // Fixed Y position near bottom
    
    // Calculate the target x position
    const targetX = centerX + (targetPosition - 1) * LANE_WIDTH;
    
    // Smooth movement
    if (currentX < targetX) {
        currentX = Math.min(currentX + MOVEMENT_SPEED, targetX);
    } else if (currentX > targetX) {
        currentX = Math.max(currentX - MOVEMENT_SPEED, targetX);
    }

    // Draw runner at currentX instead of calculated position
    ctx.fillStyle = '#333';
    
    // Body
    ctx.fillRect(currentX - CHARACTER_WIDTH/2, y - CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
    
    // Head
    ctx.beginPath();
    ctx.arc(currentX, y - CHARACTER_HEIGHT - 15, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Legs in running position (alternating)
    const time = Date.now() / 200; // Controls leg animation speed
    const legSpread = Math.sin(time) * 15;
    
    ctx.beginPath();
    ctx.moveTo(currentX, y - CHARACTER_HEIGHT + 10);
    ctx.lineTo(currentX - legSpread, y);
    ctx.lineTo(currentX + legSpread, y);
    ctx.closePath();
    ctx.fill();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function startGame() {
    isGameOver = false;
    score = 0;
    // Hide the start button
    document.getElementById('startButton').style.display = 'none';
    initializeCanvas();
    gameLoop();
}

// Start the game when the page loads
window.addEventListener('load', initializeCanvas);

function gameLoop() {
    if (!isGameOver) {
        clearCanvas();
        drawRunner();
        updateGame();
        requestAnimationFrame(gameLoop);
    }
}

function updateGame() {
    // Update game state
    if (!isGameOver) {
        // Basic game state updates will go here
        // This keeps the game loop active
        score += 0.1;
        document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;
    }
}

function jump() {
    // Logic for jumping over obstacles
}

function slide() {
    // Logic for sliding under barriers
}

function switchLane(direction) {
    if (direction === 'left' && targetPosition > 0) {
        targetPosition--;
    } else if (direction === 'right' && targetPosition < 2) {
        targetPosition++;
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

// Event listeners for keyboard controls
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowLeft':
            switchLane('left');
            break;
        case 'ArrowRight':
            switchLane('right');
            break;
        case 'ArrowUp':
            jump();
            break;
        case 'ArrowDown':
            slide();
            break;
    }
});