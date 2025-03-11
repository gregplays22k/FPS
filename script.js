const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Player setup
let player = new THREE.Object3D();
scene.add(player);
camera.position.set(0, 1.6, 0);
player.add(camera);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Weapons
let weapons = [];
let currentWeaponIndex = 0;
const weaponDisplay = document.getElementById("weaponDisplay");

function createGun(color, size, positionZ) {
  let gun = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshBasicMaterial({ color: color })
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

// Player Controls
let keys = { forward: false, backward: false, left: false, right: false };
let bullets = [];
let enemyBullets = [];

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

document.addEventListener('click', () => {
  document.body.requestPointerLock();
  shoot();
});

function shoot() {
  let bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  bullet.position.copy(camera.position);
  let direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  let bulletSpeed = currentWeaponIndex === 0 ? 0.5 : currentWeaponIndex === 1 ? 0.7 : 0.3;
  bullet.velocity = direction.multiplyScalar(bulletSpeed);
  bullets.push(bullet);
  scene.add(bullet);
}

// Enemies
let enemies = [];
for (let i = 0; i < 3; i++) {
  let enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
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

    if (distance < 10 && Math.random() < 0.02) {
      let enemyBullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      enemyBullet.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
      let bulletDirection = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
      enemyBullet.velocity = bulletDirection.multiplyScalar(0.3);
      enemyBullets.push(enemyBullet);
      scene.add(enemyBullet);
    }
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

  if (keys.forward) player.position.z -= 0.1;
  if (keys.backward) player.position.z += 0.1;
  if (keys.left) player.position.x -= 0.1;
  if (keys.right) player.position.x += 0.1;

  enemyAI();
  updateBullets();
  renderer.render(scene, camera);
}

animate();
