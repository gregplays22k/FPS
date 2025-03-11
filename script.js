// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up controls (WASD, mouse look)
let playerSpeed = 0.1;
let cameraRotationSpeed = 0.005;
let mouseX = 0, mouseY = 0;

let keys = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

// Event listeners for WASD and mouse movement
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') keys.forward = true;
  if (event.key === 's') keys.backward = true;
  if (event.key === 'a') keys.left = true;
  if (event.key === 'd') keys.right = true;
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'w') keys.forward = false;
  if (event.key === 's') keys.backward = false;
  if (event.key === 'a') keys.left = false;
  if (event.key === 'd') keys.right = false;
});

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('click', () => {
  shoot();
});

// Player's position and velocity
let player = new THREE.Object3D();
scene.add(player);
camera.position.set(0, 1.6, 0);
camera.rotation.set(0, 0, 0);
player.add(camera);

// Create a floor
const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Add enemies (simple cubes for now)
let enemies = [];
for (let i = 0; i < 5; i++) {
  let enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  enemy.position.set(Math.random() * 50 - 25, 1, Math.random() * 50 - 25);
  enemies.push(enemy);
  scene.add(enemy);
}

// Bullet simulation
let bullets = [];

function shoot() {
  let bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  bullet.position.set(camera.position.x, camera.position.y, camera.position.z);
  let direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  bullet.velocity = direction.multiplyScalar(0.5);
  bullets.push(bullet);
  scene.add(bullet);
}

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Player movement
  if (keys.forward) player.position.z -= playerSpeed;
  if (keys.backward) player.position.z += playerSpeed;
  if (keys.left) player.position.x -= playerSpeed;
  if (keys.right) player.position.x += playerSpeed;

  // Mouse look controls
  camera.rotation.y = mouseX * Math.PI;
  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x + mouseY * cameraRotationSpeed));

  // Bullet update
  bullets.forEach(bullet => {
    bullet.position.add(bullet.velocity);
  });

  // Check bullet collisions
  bullets.forEach(bullet => {
    enemies.forEach(enemy => {
      if (bullet.position.distanceTo(enemy.position) < 1) {
        scene.remove(enemy);
      }
    });
  });

  // Render the scene
  renderer.render(scene, camera);
}

animate();
