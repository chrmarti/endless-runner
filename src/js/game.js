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

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, -10);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
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
        const railGeometry = new THREE.BoxGeometry(0.2, 0.1, 100);
        const railMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
        
        const leftRail = new THREE.Mesh(railGeometry, railMaterial);
        const rightRail = new THREE.Mesh(railGeometry, railMaterial);
        
        leftRail.position.set(i * LANE_WIDTH - 0.5, 0, -50);
        rightRail.position.set(i * LANE_WIDTH + 0.5, 0, -50);
        
        track.add(leftRail);
        track.add(rightRail);

        // Create sleepers
        for (let j = 0; j < 50; j++) {
            const sleeperGeometry = new THREE.BoxGeometry(2, 0.1, 0.4);
            const sleeperMaterial = new THREE.MeshPhongMaterial({ color: 0x5c4033 });
            const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
            
            sleeper.position.set(i * LANE_WIDTH, -0.05, -j * 2);
            track.add(sleeper);
        }
    }

    scene.add(track);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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

    // Update score
    score += 0.1;
    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;

    // Increase difficulty
    trackSpeed = 0.1 + (score / 2000); // Adjusted difficulty scaling
}

function animate() {
    requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

// Initialize and start the game
function startGame() {
    isGameOver = false;
    score = 0;
    playerPosition = 1;
    targetPosition = LANE_WIDTH;
    document.getElementById('startButton').style.display = 'none';
    animate();
}

// Setup event listeners
document.getElementById('startButton').addEventListener('click', () => {
    init();
    startGame();
});