// Import GSAP for animations
const gsapScript = document.createElement("script");
gsapScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
document.head.appendChild(gsapScript);

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
weapons.push(createGun(0x333333, { x: 0.3, y: 0.3, z: 1.2 }, -0.8)); // Rifle
weapons.push(createGun(0x222222, { x: 0.4, y: 0.4, z: 1.5 }, -1.2)); // Shotgun

function updateWeaponDisplay() {
  let weaponNames = ["Pistol", "Rifle", "Shotgun"];
  weaponDisplay.innerText = `Weapon: ${weaponNames[currentWeaponIndex]}`;
}

function switchWeapon(index) {
  weapons.forEach((gun, i) => gun.visible = (i === index));
  currentWeaponIndex = index;
  updateWeaponDisplay();
}

switchWeapon(0);

// Player Health
let playerHealth = 100;
const healthDisplay = document.getElementById("healthDisplay");

function updateHealthDisplay() {
  healthDisplay.innerText = `Health: ${playerHealth}`;
}

updateHealthDisplay();

// Player Controls
let keys = { forward: false, backward: false, left: false, right: false };
let bullets = [];
let enemyBullets = [];

// Handle movement keys
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') keys.forward = true;
  if (event.key === 's') keys.backward = true;
  if (event.key === 'a') keys.left = true;
  if (event.key === 'd') keys.right = true;
  if (event.key === '1') switchWeapon(0);
  if (event.key === '2') switchWeapon(1);
  if (event.key === '3') switchWeapon(2);
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'w') keys.forward = false;
  if (event.key === 's') keys.backward = false;
  if (event.key === 'a') keys.left = false;
  if (event.key === 'd') keys.right = false;
});

// Mouse Look
document.addEventListener('click', () => {
  document.body.requestPointerLock();
});

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === document.body) {
    let sensitivity = 0.002;
    player.rotation.y -= event.movementX * sensitivity;
    pitchObject.rotation.x -= event.movementY * sensitivity;
    pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchObject.rotation.x));
  }
});

// Shooting with Gun Animation
document.addEventListener('click', shoot);

function shoot() {
  let gun = weapons[currentWeaponIndex];

  // Gun recoil animation
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

// Enemies as Sprites
let enemies = [];
const enemyTexture = new THREE.TextureLoader().load("enemy.png"); // Load your enemy sprite

for (let i = 0; i < 5; i++) {
  let enemyMaterial = new THREE.SpriteMaterial({ map: enemyTexture });
  let enemy = new THREE.Sprite(enemyMaterial);
  enemy.scale.set(2, 3, 1);
  enemy.position.set(Math.random() * 20 - 10, 1, Math.random() * 20 - 10);
  enemy.health = 3;
  enemies.push(enemy);
  scene.add(enemy);
}

function enemyAI() {
  enemies.forEach(enemy => {
    let playerDirection = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
    let distance = enemy.position.distanceTo(player.position);

    if (distance > 3) {
      enemy.position.addScaledVector(playerDirection, 0.02);
    }

    if (distance < 10 && Math.random() < 0.05) {
      let enemyBullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      enemyBullet.position.copy(enemy.position);
      let bulletDirection = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
      enemyBullet.velocity = bulletDirection.multiplyScalar(1.5);
      enemyBullets.push(enemyBullet);
      scene.add(enemyBullet);
    }

    // Ensure enemy always faces the player
    enemy.lookAt(player.position);
  });
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
    bullet.position.add(bullet.velocity);
    enemies.forEach(enemy => {
      if (bullet.position.distanceTo(enemy.position) < 1) {
        enemy.health -= 1;
        scene.remove(bullet);
        bullets.splice(index, 1);
        if (enemy.health <= 0) {
          scene.remove(enemy);
          enemies.splice(enemies.indexOf(enemy), 1);
        }
      }
    });
  });

  enemyBullets.forEach((bullet, index) => {
    bullet.position.add(bullet.velocity);
    if (bullet.position.distanceTo(player.position) < 1) {
      playerHealth -= 10;
      scene.remove(bullet);
      enemyBullets.splice(index, 1);
      updateHealthDisplay();
      if (playerHealth <= 0) {
        alert("Game Over! You died.");
        location.reload();
      }
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (keys.forward) player.translateZ(-0.1);
  if (keys.backward) player.translateZ(0.1);
  if (keys.left) player.translateX(-0.1);
  if (keys.right) player.translateX(0.1);

  enemyAI();
  updateBullets();
  renderer.render(scene, camera);
}

animate();
