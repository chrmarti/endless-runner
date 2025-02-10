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
    const trainGeometry = new THREE.BoxGeometry(1.5, 2, 4);
    const trainMaterial = new THREE.MeshPhongMaterial({ color: 0x3366cc });
    const train = new THREE.Mesh(trainGeometry, trainMaterial);
    
    // Random lane selection (0, 1, or 2)
    const lane = Math.floor(Math.random() * 3);
    train.position.set((lane - 1) * LANE_WIDTH, 1, -100);
    train.castShadow = true;
    train.receiveShadow = true;
    
    scene.add(train);
    trains.push({
        mesh: train,
        lane: lane
    });
}

function checkCollision(trainObject) {
    const train = trainObject.mesh;
    const playerBoundingBox = new THREE.Box3().setFromObject(player);
    const trainBoundingBox = new THREE.Box3().setFromObject(train);
    
    return playerBoundingBox.intersectsBox(trainBoundingBox);
}

function gameOver() {
    isGameOver = true;
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
    const jumpHeight = 2;
    const jumpDuration = 500;
    const startTime = Date.now();
    const startY = player.position.y;

    jumpAnimation = function() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / jumpDuration;

        if (progress < 1) {
            const height = Math.sin(progress * Math.PI) * jumpHeight;
            player.position.y = startY + height;
            return true;
        } else {
            player.position.y = startY;
            return false;
        }
    };
}

function updateGame() {
    if (isGameOver) return;

    // Update track position
    track.position.z = (track.position.z + trackSpeed) % 2;

    // Update player horizontal position
    if (player.position.x < targetPosition - LANE_WIDTH) {
        player.position.x += MOVEMENT_SPEED;
    } else if (player.position.x > targetPosition - LANE_WIDTH) {
        player.position.x -= MOVEMENT_SPEED;
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
    trackSpeed = 0.1 + (score / 2000); // Adjusted difficulty scaling
    trainSpeed = INITIAL_TRAIN_SPEED + (score / 1500); // Trains speed up slightly faster than track
}

function animate() {
    requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

// Initialize and start the game
function startGame() {
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
    trackSpeed = 0.1; // Reset to initial track speed
    trainSpeed = INITIAL_TRAIN_SPEED; // Reset to initial train speed
    jumpAnimation = null;
    lastTrainSpawn = Date.now();
    
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('score').textContent = 'Score: 0';
    
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