// Import GSAP for animations
const gsapScript = document.createElement("script");
gsapScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
document.head.appendChild(gsapScript);

// Initialize Socket.io for multiplayer
const socket = io();

// Set up Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Player setup
let player = new THREE.Object3D();
scene.add(player);

let pitchObject = new THREE.Object3D();
pitchObject.add(camera);
player.add(pitchObject);

camera.position.set(0, 1.6, 0);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Weapons
let weapons = [];
let currentWeaponIndex = 0;
const weaponDisplay = document.getElementById("weaponDisplay");

function createGun(color, size, positionZ) {
  let gun = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.3 })
  );
  gun.position.set(0.2, -0.3, positionZ);
  camera.add(gun);
  return gun;
}

weapons.push(createGun(0x888888, { x: 0.2, y: 0.2, z: 0.6 }, -0.5)); // Pistol
switchWeapon(0);

function switchWeapon(index) {
  weapons.forEach((gun, i) => gun.visible = (i === index));
  currentWeaponIndex = index;
  updateWeaponDisplay();
}

function updateWeaponDisplay() {
  weaponDisplay.innerText = `Weapon: Pistol`;
}

// Player Health with Invincibility Timer
let playerHealth = 100;
let invincible = true;
setTimeout(() => invincible = false, 2000); // Invincible for first 2 seconds

const healthDisplay = document.getElementById("healthDisplay");

function updateHealthDisplay() {
  healthDisplay.innerText = `Health: ${playerHealth}`;
}

updateHealthDisplay();

// Multiplayer system
let otherPlayers = {};

socket.on('currentPlayers', (players) => {
  for (let id in players) {
    if (id !== socket.id) addPlayer(id, players[id]);
  }
});

socket.on('newPlayer', ({ id, position }) => addPlayer(id, position));

socket.on('updatePlayer', ({ id, position }) => {
  if (otherPlayers[id]) {
    otherPlayers[id].position.set(position.x, position.y, position.z);
  }
});

socket.on('removePlayer', (id) => {
  if (otherPlayers[id]) {
    scene.remove(otherPlayers[id]);
    delete otherPlayers[id];
  }
});

function addPlayer(id, position) {
  let newPlayer = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x0000ff })
  );
  newPlayer.position.set(position.x, position.y, position.z);
  scene.add(newPlayer);
  otherPlayers[id] = newPlayer;
}

// Player Controls
let keys = { forward: false, backward: false, left: false, right: false };
let bullets = [];

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

document.addEventListener('click', () => {
  document.body.requestPointerLock();
  shoot();
});

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === document.body) {
    let sensitivity = 0.002;
    player.rotation.y -= event.movementX * sensitivity;
    pitchObject.rotation.x -= event.movementY * sensitivity;
    pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchObject.rotation.x));
  }
});

// Shooting Mechanic
function shoot() {
  let gun = weapons[currentWeaponIndex];

  gsap.to(gun.position, { z: gun.position.z - 0.2, duration: 0.1, yoyo: true, repeat: 1 });

  let bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00 })
  );
  bullet.position.copy(camera.position);
  let direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  bullet.velocity = direction.multiplyScalar(2);
  bullets.push(bullet);
  scene.add(bullet);
}

// Send player position to server
function sendPlayerPosition() {
  socket.emit('playerMove', {
    x: player.position.x,
    y: player.position.y,
    z: player.position.z
  });
}
setInterval(sendPlayerPosition, 100);

// Chat System
const chatInput = document.getElementById('chatInput');
const chatBox = document.getElementById('chatBox');

chatInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    let message = chatInput.value;
    socket.emit('chatMessage', message);
    chatInput.value = '';
  }
});

socket.on('chatMessage', ({ id, message }) => {
  chatBox.innerHTML += `<p><strong>${id}:</strong> ${message}</p>`;
});

// Game loop
function animate() {
  requestAnimationFrame(animate);

  if (keys.forward) player.translateZ(-0.1);
  if (keys.backward) player.translateZ(0.1);
  if (keys.left) player.translateX(-0.1);
  if (keys.right) player.translateX(0.1);

  bullets.forEach((bullet) => bullet.position.add(bullet.velocity));

  renderer.render(scene, camera);
}

animate();
