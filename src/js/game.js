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
const TRACK_SCROLL_SPEED = 2; // Reduced for more natural motion

function initializeCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    function updateCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        currentX = canvas.width / 2 + (targetPosition - 1) * LANE_WIDTH;
    }
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
}

function drawRunner() {
    const horizonY = canvas.height * 0.2;
    const y = canvas.height - 100; // Fixed Y position near bottom
    const trackSpread = canvas.width / 3;
    
    // Calculate the target x position based on track perspective
    const targetX = canvas.width / 2 + (targetPosition - 1) * (trackSpread / 1.5); // Adjust for track spacing
    
    // Smooth movement
    if (currentX < targetX) {
        currentX = Math.min(currentX + MOVEMENT_SPEED, targetX);
    } else if (currentX > targetX) {
        currentX = Math.max(currentX - MOVEMENT_SPEED, targetX);
    }

    // Draw runner
    ctx.fillStyle = '#333';
    
    // Body with slight perspective tilt
    const bodyTilt = (currentX - canvas.width/2) * 0.05; // Tilt based on position
    ctx.save();
    ctx.translate(currentX, y);
    ctx.rotate(bodyTilt);
    ctx.fillRect(-CHARACTER_WIDTH/2, -CHARACTER_HEIGHT, CHARACTER_WIDTH, CHARACTER_HEIGHT);
    
    // Head with tilt
    ctx.beginPath();
    ctx.arc(0, -CHARACTER_HEIGHT - 15, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Legs with running animation and perspective
    const time = Date.now() / 200;
    const legSpread = Math.sin(time) * 15;
    
    ctx.beginPath();
    ctx.moveTo(0, -CHARACTER_HEIGHT + 10);
    ctx.lineTo(-legSpread, 0);
    ctx.lineTo(legSpread, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawTracks() {
    const horizonY = canvas.height * 0.35; // Match exact horizon line with mountains
    const vanishingPointX = canvas.width / 2;
    const vanishingPointY = horizonY;
    const trackWidth = canvas.width * 0.015; // Further reduced for better proportion
    const trackSpread = canvas.width * 0.1; // Tighter track spacing
    const bottomSleeperWidth = trackWidth * 2.2;

    // Ground gradient to match mountain bases
    const groundGradient = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
    groundGradient.addColorStop(0, '#475355'); // Match front mountain color
    groundGradient.addColorStop(0.1, '#8B7355'); // Transition to ground color
    groundGradient.addColorStop(1, '#6B5335');
    
    ctx.fillStyle = groundGradient;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(canvas.width, horizonY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Draw three parallel tracks
    for (let i = -1; i <= 1; i++) {
        const trackCenterX = vanishingPointX + (i * trackSpread);
        
        // Draw track bed with improved perspective
        const bedWidth = bottomSleeperWidth * 1.1; // Slightly reduced for better look
        ctx.beginPath();
        ctx.moveTo(trackCenterX - bedWidth, canvas.height);
        ctx.lineTo(vanishingPointX, vanishingPointY);
        ctx.lineTo(vanishingPointX, vanishingPointY);
        ctx.lineTo(trackCenterX + bedWidth, canvas.height);
        const ballastGradient = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
        ballastGradient.addColorStop(0, '#757575');
        ballastGradient.addColorStop(1, '#696969');
        ctx.fillStyle = ballastGradient;
        ctx.fill();

        // Draw sleepers with improved perspective
        const numSleepers = 25;
        for (let j = 0; j < numSleepers; j++) {
            const progress = (j + trackOffset/50) / numSleepers;
            const y = canvas.height - progress * (canvas.height - vanishingPointY);
            
            if (y > vanishingPointY) {
                const perspective = Math.pow(1 - progress, 1.8);
                const perspectiveX = vanishingPointX + (i * trackSpread * perspective);
                const sleeperWidth = bottomSleeperWidth * perspective;
                const sleeperThickness = Math.max(2, 3 * perspective);
                
                // Enhanced shadow with fade
                ctx.beginPath();
                const shadowY = y + (2 * perspective);
                ctx.moveTo(perspectiveX - sleeperWidth, shadowY);
                ctx.lineTo(perspectiveX + sleeperWidth, shadowY);
                ctx.strokeStyle = `rgba(0, 0, 0, ${0.2 * (1 - progress)})`;
                ctx.lineWidth = sleeperThickness + 1;
                ctx.stroke();

                // Draw sleeper with enhanced wood texture
                const woodTone = Math.random() * 20;
                const woodColor = `rgb(${89 + woodTone}, ${49 + woodTone}, ${19 + woodTone})`;
                ctx.strokeStyle = woodColor;
                ctx.lineWidth = sleeperThickness;
                ctx.beginPath();
                ctx.moveTo(perspectiveX - sleeperWidth, y);
                ctx.lineTo(perspectiveX + sleeperWidth, y);
                ctx.stroke();
            }
        }

        // Draw rails with enhanced metal effect
        const bottomRailSpacing = bottomSleeperWidth * 0.45;
        [-1, 1].forEach(railSide => {
            const startX = trackCenterX + (bottomRailSpacing * railSide);
            
            // Rail shadow
            ctx.beginPath();
            ctx.moveTo(startX + 1, canvas.height);
            ctx.lineTo(vanishingPointX, vanishingPointY);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Base rail
            ctx.beginPath();
            ctx.moveTo(startX, canvas.height);
            ctx.lineTo(vanishingPointX, vanishingPointY);
            ctx.strokeStyle = '#2A2A2A';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Rail highlight
            ctx.beginPath();
            ctx.moveTo(startX, canvas.height);
            ctx.lineTo(vanishingPointX, vanishingPointY);
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Add metallic sheen
            ctx.beginPath();
            ctx.moveTo(startX, canvas.height);
            ctx.lineTo(vanishingPointX, vanishingPointY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Enhanced gravel effect
        for (let k = 0; k < 150; k++) {
            const progress = (k + trackOffset/50) % 1;
            const y = vanishingPointY + progress * (canvas.height - vanishingPointY);
            const perspective = Math.pow(progress, 1.2);
            
            const maxSpread = bedWidth * perspective;
            const xOffset = (Math.random() - 0.5) * maxSpread * 2;
            const baseX = vanishingPointX + (i * trackSpread * perspective);
            const x = baseX + xOffset;
            
            const size = 2 * perspective;
            const gravel = Math.random();
            ctx.fillStyle = gravel > 0.7 ? '#858585' : 
                          gravel > 0.3 ? '#7A7A7A' : '#696969';
            ctx.fillRect(x, y, size, size);
        }
    }
}

function gameLoop() {
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adjust horizon position
    const horizonY = canvas.height * 0.35; // Moved horizon down for better composition

    // Create richer sky gradient with adjusted stops
    const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    gradient.addColorStop(0, '#0047AB');    // Cobalt blue at top
    gradient.addColorStop(0.3, '#0066cc');  // Deep blue
    gradient.addColorStop(0.6, '#4d94ff');  // Mid blue
    gradient.addColorStop(0.8, '#80b3ff');  // Light blue
    gradient.addColorStop(1, '#cce0ff');    // Very light blue at horizon
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add atmospheric haze gradient
    const hazeGradient = ctx.createLinearGradient(0, horizonY - 100, 0, horizonY);
    hazeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    hazeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
    ctx.fillStyle = hazeGradient;
    ctx.fillRect(0, horizonY - 100, canvas.width, 100);

    // Draw mountains aligned with horizon
    drawMountainLayer(horizonY - 30, '#1a2f2f', 0.04); // Back mountains
    drawMountainLayer(horizonY - 15, '#2F4F4F', 0.05); // Middle mountains
    drawMountainLayer(horizonY, '#475355', 0.06);      // Front mountains

    // Draw game elements
    drawTracks();
    drawRunner();
    updateGame();

    requestAnimationFrame(gameLoop);
}

function drawMountainLayer(baseY, color, heightFactor) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    
    // Smoother, more natural mountain silhouette without movement
    const points = 30;
    for(let i = 0; i <= points; i++) {
        const x = (canvas.width * i) / points;
        // Remove trackOffset from sine calculations to keep mountains static
        const variance = Math.sin(i * 0.5) * 0.7 + 
                        Math.sin(i * 0.7) * 0.5 +
                        Math.sin(i * 0.3) * 0.3;
        const height = variance * canvas.height * heightFactor;
        ctx.lineTo(x, baseY - Math.abs(height));
    }
    
    ctx.lineTo(canvas.width, baseY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Add atmospheric depth effect
    ctx.fillStyle = `rgba(255, 255, 255, ${heightFactor * 3})`; // More fog for distant mountains
    ctx.fill();
}

// Single initialization point
window.addEventListener('load', () => {
    initializeCanvas();
    gameLoop();
});

function startGame() {
    isGameOver = false;
    score = 0;
    document.getElementById('startButton').style.display = 'none';
    initializeCanvas();
    gameLoop();
}

// Clean up initialization by removing duplicate load listeners
// and consolidating the startup sequence
window.addEventListener('load', () => {
    initializeCanvas();
    drawTracks(); // Initial draw of tracks
    drawRunner(); // Initial draw of runner
});

// Remove the other load event listeners that were duplicated

function updateGame() {
    if (!isGameOver) {
        // Use non-linear acceleration for perspective-correct scrolling
        const perspectiveSpeedMultiplier = 1 + (score / 1000); // Gradually increase speed
        const scrollSpeed = TRACK_SCROLL_SPEED * perspectiveSpeedMultiplier;
        trackOffset = (trackOffset + scrollSpeed) % 50;
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