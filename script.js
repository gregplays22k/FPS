const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Player
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

// Player Controls
let keys = { forward: false, backward: false, left: false, right: false };
let bullets = [];

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

  // Different bullet speed for different weapons
  let bulletSpeed = currentWeaponIndex === 0 ? 0.5 : currentWeaponIndex === 1 ? 0.7 : 0.3;
  bullet.velocity = direction.multiplyScalar(bulletSpeed);
  bullets.push(bullet);
  scene.add(bullet);
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
    bullet.position.add(bullet.velocity);
    if (bullet.position.distanceTo(camera.position) > 50) {
      scene.remove(bullet);
      bullets.splice(index, 1);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (keys.forward) player.position.z -= 0.1;
  if (keys.backward) player.position.z += 0.1;
  if (keys.left) player.position.x -= 0.1;
  if (keys.right) player.position.x += 0.1;

  updateBullets();
  renderer.render(scene, camera);
}

animate();
