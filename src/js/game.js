import * as THREE from 'three';

let scene, camera, renderer;
let track, player;
let score = 0;
let isGameOver = false;
let playerPosition = 1; // 0: left lane, 1: middle lane, 2: right lane
let targetPosition = 1;
const LANE_WIDTH = 4;
const MOVEMENT_SPEED = 0.2;
let jumpAnimation = null;
let trackSpeed = 0.1; // Reduced speed for more natural motion

// Train-related variables
let trains = [];
const INITIAL_TRAIN_SPEED = 0.4;
let trainSpeed = INITIAL_TRAIN_SPEED;
const TRAIN_SPAWN_INTERVAL = 3000; // Spawn a new train every 3 seconds
let lastTrainSpawn = 0;
const WAGON_COUNT = 3; // Number of wagons per train
const WAGON_GAP = 4.5; // Gap between wagons

// Add this near the other game state variables at the top
let animationFrameId = null;

// Add these variables near other game state variables
let isRidingTrain = false;
let currentTrain = null;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 30, 120); // Adjusted fog settings

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 8); // Moved camera higher up and closer
    camera.lookAt(0, -2, -20); // Adjusted look target to angle down more

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x87ceeb); // Sky blue
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Create lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    createEnvironment();
    createPlayer();
    createTrack();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
}

function createEnvironment() {
    // Create mountains
    const mountainGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const mountainCount = 20;
    
    for (let i = 0; i < mountainCount; i++) {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * -100 - 50;
        const height = Math.random() * 20 + 10;
        
        vertices.push(
            x - 5, 0, z,
            x + 5, 0, z,
            x, height, z
        );
    }
    
    mountainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const mountainMaterial = new THREE.MeshPhongMaterial({ color: 0x4a6363 });
    const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
    scene.add(mountains);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createPlayer() {
    // Create player character
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0x333333 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);
}

function createTrack() {
    track = new THREE.Group();

    // Create three lanes
    for (let i = -1; i <= 1; i++) {
        // Create rails
        const railGeometry = new THREE.BoxGeometry(0.2, 0.1, 200); // Doubled length
        const railMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
        
        const leftRail = new THREE.Mesh(railGeometry, railMaterial);
        const rightRail = new THREE.Mesh(railGeometry, railMaterial);
        
        leftRail.position.set(i * LANE_WIDTH - 0.5, 0, -100); // Adjusted z-position
        rightRail.position.set(i * LANE_WIDTH + 0.5, 0, -100); // Adjusted z-position
        
        track.add(leftRail);
        track.add(rightRail);

        // Create sleepers
        for (let j = 0; j < 100; j++) { // Doubled number of sleepers
            const sleeperGeometry = new THREE.BoxGeometry(2, 0.1, 0.4);
            const sleeperMaterial = new THREE.MeshPhongMaterial({ color: 0x5c4033 });
            const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
            
            sleeper.position.set(i * LANE_WIDTH, -0.05, -j * 2);
            track.add(sleeper);
        }
    }

    scene.add(track);
}

function createTrain() {
    const trainGroup = new THREE.Group();
    
    // Random lane selection (0, 1, or 2)
    const lane = Math.floor(Math.random() * 3);
    const xPosition = (lane - 1) * LANE_WIDTH;
    
    // Create locomotive (first wagon)
    const locomotiveGeometry = new THREE.BoxGeometry(1.5, 2, 4);
    const locomotiveMaterial = new THREE.MeshPhongMaterial({ color: 0x3366cc });
    const locomotive = new THREE.Mesh(locomotiveGeometry, locomotiveMaterial);
    locomotive.position.set(0, 1, 0);
    locomotive.castShadow = true;
    locomotive.receiveShadow = true;
    trainGroup.add(locomotive);
    
    // Create additional wagons
    for (let i = 1; i < WAGON_COUNT; i++) {
        const wagonGeometry = new THREE.BoxGeometry(1.5, 1.8, 4);
        const wagonMaterial = new THREE.MeshPhongMaterial({ color: 0x2255aa });
        const wagon = new THREE.Mesh(wagonGeometry, wagonMaterial);
        wagon.position.set(0, 1, i * WAGON_GAP); // Position each wagon behind the previous one
        wagon.castShadow = true;
        wagon.receiveShadow = true;
        trainGroup.add(wagon);
    }
    
    trainGroup.position.set(xPosition, 0, -100);
    scene.add(trainGroup);
    
    trains.push({
        mesh: trainGroup,
        lane: lane
    });
}

function checkCollision(trainObject) {
    const train = trainObject.mesh;
    const playerBoundingBox = new THREE.Box3().setFromObject(player);
    const trainBoundingBox = new THREE.Box3().setFromObject(train);
    
    // Check if player is above the train and falling down (during jump)
    if (player.position.y > 2 && jumpAnimation) {
        const horizontalIntersect = 
            player.position.x >= train.position.x - 0.75 && 
            player.position.x <= train.position.x + 0.75;
        const verticalIntersect = 
            player.position.z >= train.position.z - 2 && 
            player.position.z <= train.position.z + WAGON_COUNT * WAGON_GAP;
        
        if (horizontalIntersect && verticalIntersect) {
            // Land on the train
            isRidingTrain = true;
            currentTrain = trainObject;
            player.position.y = 2.5; // Position player on top of train
            if (jumpAnimation) jumpAnimation = null; // Cancel jump animation
            return false;
        }
    }
    
    // Only check for side/front collisions if not riding a train
    if (!isRidingTrain) {
        // Adjust collision box for train to not include the top
        const trainTopY = train.position.y + 2;  // Height of train
        const playerBottomY = player.position.y - 0.5;  // Bottom of player
        
        if (playerBottomY >= trainTopY) {
            return false; // Player is above train, no collision
        }
        
        return playerBoundingBox.intersectsBox(trainBoundingBox);
    }
    
    return false;
}

function gameOver() {
    isGameOver = true;
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    document.getElementById('startButton').style.display = 'block';
    document.getElementById('startButton').textContent = 'Game Over - Try Again';
}

function updateTrains() {
    const currentTime = Date.now();
    
    // Spawn new trains
    if (currentTime - lastTrainSpawn > TRAIN_SPAWN_INTERVAL) {
        createTrain();
        lastTrainSpawn = currentTime;
    }
    
    // Update train positions and check collisions
    for (let i = trains.length - 1; i >= 0; i--) {
        const train = trains[i];
        train.mesh.position.z += trainSpeed;
        
        // Check for collision
        if (checkCollision(train)) {
            gameOver();
            return;
        }
        
        // Remove trains that have passed the player
        if (train.mesh.position.z > 10) {
            scene.remove(train.mesh);
            trains.splice(i, 1);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
}

function handleKeyDown(event) {
    if (isGameOver) return;

    switch(event.key) {
        case 'ArrowLeft':
            if (playerPosition > 0) {
                playerPosition--;
                targetPosition = playerPosition * LANE_WIDTH;
            }
            break;
        case 'ArrowRight':
            if (playerPosition < 2) {
                playerPosition++;
                targetPosition = playerPosition * LANE_WIDTH;
            }
            break;
        case 'ArrowUp':
            if (!jumpAnimation) jump();
            break;
    }
}

function jump() {
    if (isRidingTrain && jumpAnimation) return; // Prevent double jumping from train
    
    const jumpHeight = isRidingTrain ? 3 : 2; // Higher jump from train
    const jumpDuration = 500;
    const startTime = Date.now();
    const startY = player.position.y;

    jumpAnimation = function() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / jumpDuration;

        if (progress < 1) {
            const height = Math.sin(progress * Math.PI) * jumpHeight;
            player.position.y = startY + height;
            
            // If jumping off train, release from train at peak of jump
            if (isRidingTrain && progress > 0.5) {
                isRidingTrain = false;
                currentTrain = null;
            }
            return true;
        } else {
            player.position.y = isRidingTrain ? 2.5 : 0.5; // Land on train or ground
            return false;
        }
    };
}

function updateGame() {
    if (isGameOver) return;

    // Update track position
    track.position.z = (track.position.z + trackSpeed) % 2;

    // Update player position based on train riding status
    if (isRidingTrain && currentTrain) {
        // Check if train has moved too far forward
        if (currentTrain.mesh.position.z > 3) { // Reduced from 5 to 3 for earlier dismount
            // Make player fall off with a small jump animation
            isRidingTrain = false;
            currentTrain = null;
            
            // Create a small falling animation
            const fallStartTime = Date.now();
            const fallDuration = 300;
            const startY = player.position.y;
            
            jumpAnimation = function() {
                const elapsed = Date.now() - fallStartTime;
                const progress = elapsed / fallDuration;

                if (progress < 1) {
                    player.position.y = startY * (1 - progress) + 0.5 * progress;
                    player.position.z = Math.max(0, player.position.z - trainSpeed * 2);
                    return true;
                } else {
                    player.position.y = 0.5;
                    player.position.z = 0;
                    return false;
                }
            };
        } else {
            // Move with the train
            player.position.z = currentTrain.mesh.position.z;
            player.position.x = currentTrain.mesh.position.x;
        }
    } else {
        // Normal ground movement
        if (player.position.x < targetPosition - LANE_WIDTH) {
            player.position.x += MOVEMENT_SPEED;
        } else if (player.position.x > targetPosition - LANE_WIDTH) {
            player.position.x -= MOVEMENT_SPEED;
        }
        // Keep player at the game's focal point when not on train
        player.position.z = 0;
    }

    // Update jump animation
    if (jumpAnimation && !jumpAnimation()) {
        jumpAnimation = null;
    }

    // Update trains
    updateTrains();

    // Update score
    score += 0.1;
    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;

    // Increase difficulty
    trackSpeed = 0.1 + (score / 2000);
    trainSpeed = INITIAL_TRAIN_SPEED + (score / 1500);
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

// Initialize and start the game
function startGame() {
    // Cancel any existing animation loop
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Remove any existing trains
    trains.forEach(train => {
        scene.remove(train.mesh);
    });
    trains = [];

    // Reset player position
    player.position.set(0, 0.5, 0);
    playerPosition = 1;
    targetPosition = LANE_WIDTH;

    // Reset track
    track.position.z = 0;
    
    // Reset game state and speeds
    isGameOver = false;
    score = 0;
    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`; // Ensure score display is reset
    trackSpeed = 0.1; // Reset to initial track speed
    trainSpeed = INITIAL_TRAIN_SPEED; // Reset to initial train speed
    jumpAnimation = null;
    lastTrainSpawn = Date.now();
    isRidingTrain = false;
    currentTrain = null;
    
    document.getElementById('startButton').style.display = 'none';
    
    // Start game loop
    animate();
}

// Setup event listeners
document.getElementById('startButton').addEventListener('click', () => {
    if (!scene) {
        init();
    }
    startGame();
});