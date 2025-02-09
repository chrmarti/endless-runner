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
let trackOffset = 0;
const TRACK_SCROLL_SPEED = 2;

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

function drawTracks() {
    const horizonY = canvas.height * 0.2;
    const trackWidth = 40; // Slightly wider tracks
    const bottomSpacing = canvas.width / 6; // Adjust spacing between tracks
    const centerX = canvas.width / 2; // Center point reference

    // Draw ground
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(canvas.width, horizonY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Draw three parallel tracks
    for (let i = -1; i <= 1; i++) {
        const trackCenterX = centerX + (i * bottomSpacing);
        
        // Draw track bed (ballast)
        ctx.beginPath();
        ctx.moveTo(trackCenterX - trackWidth * 2, canvas.height);
        ctx.lineTo(trackCenterX - trackWidth * 0.4, horizonY);
        ctx.lineTo(trackCenterX + trackWidth * 0.4, horizonY);
        ctx.lineTo(trackCenterX + trackWidth * 2, canvas.height);
        ctx.fillStyle = '#696969';
        ctx.fill();

        // Draw sleepers with scrolling effect
        const numSleepers = 25;
        for (let j = 0; j < numSleepers; j++) {
            const progress = (j + trackOffset/50) / numSleepers;
            const y = canvas.height - progress * (canvas.height - horizonY);
            if (y > horizonY) {
                const perspective = 1 - progress * 0.8;
                const sleeperWidth = trackWidth * 2 * perspective;
                
                const woodTone = Math.random() * 20;
                ctx.strokeStyle = `rgb(${89 + woodTone}, ${49 + woodTone}, ${19 + woodTone})`;
                ctx.lineWidth = 4 * perspective;
                
                ctx.beginPath();
                ctx.moveTo(trackCenterX - sleeperWidth, y);
                ctx.lineTo(trackCenterX + sleeperWidth, y);
                ctx.stroke();
            }
        }

        // Draw rails with metallic effect
        [-1, 1].forEach(railSide => {
            const railOffset = trackWidth * 0.7 * railSide;
            const vanishingOffset = trackWidth * 0.15 * railSide;
            
            // Base rail
            ctx.beginPath();
            ctx.moveTo(trackCenterX + railOffset, canvas.height);
            ctx.lineTo(trackCenterX + vanishingOffset, horizonY);
            ctx.strokeStyle = '#2A2A2A';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Rail highlight
            ctx.beginPath();
            ctx.moveTo(trackCenterX + railOffset, canvas.height);
            ctx.lineTo(trackCenterX + vanishingOffset, horizonY);
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw scrolling gravel
        for (let k = 0; k < 100; k++) {
            const xSpread = Math.random() * trackWidth * 3 - trackWidth * 1.5;
            const yProgress = (k + trackOffset/50) % 1;
            const y = horizonY + yProgress * (canvas.height - horizonY);
            const perspective = 1 - ((y - horizonY) / (canvas.height - horizonY));
            const x = trackCenterX + xSpread * perspective;
            const size = 2 * (1 - yProgress * 0.5);
            
            ctx.fillStyle = Math.random() > 0.5 ? '#7A7A7A' : '#858585';
            ctx.fillRect(x, y, size, size);
        }
    }
}

function clearCanvas() {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function startGame() {
    isGameOver = false;
    score = 0;
    // Hide the start button
    document.getElementById('startButton').style.display = 'none';
    initializeCanvas();
    gameLoop();
}

// Initialize game state when page loads
window.addEventListener('load', () => {
    initializeCanvas();
    clearCanvas();
    drawTracks();
    drawRunner();
});

function gameLoop() {
    if (!isGameOver) {
        clearCanvas();
        drawTracks();
        drawRunner();
        updateGame();
        requestAnimationFrame(gameLoop);
    }
}

function updateGame() {
    if (!isGameOver) {
        // Update track scroll position
        trackOffset = (trackOffset + TRACK_SCROLL_SPEED) % 50;
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