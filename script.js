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

let keys = { forward: false, backward: false, left: false, right: false };

// Player object
let player = new THREE.Object3D();
scene.add(player);
camera.position.set(0, 1.6, 0);
player.add(camera);

// Floor setup
const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }));
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Weapons setup
const weapons = {
  pistol: { bulletSpeed: 0.5, fireRate: 300, bulletSize: 0.1 },
  rifle: { bulletSpeed: 0.8, fireRate: 100, bulletSize: 0.08 },
  shotgun: { bulletSpeed: 0.4, fireRate: 600, bulletSize: 0.15, spread: 0.1, pellets: 5 }
};

let currentWeapon = weapons.pistol;

document.addEventListener('keydown', (event) => {
  if (event.key === '1') currentWeapon = weapons.pistol;
  if (event.key === '2') currentWeapon = weapons.rifle;
  if (event.key === '3') currentWeapon = weapons.shotgun;
});

document.addEventListener('click', () => shoot());

// Shooting function
function shoot() {
  if (currentWeapon === weapons.shotgun) {
    for (let i = 0; i < currentWeapon.pellets; i++) {
      createBullet(currentWeapon, (Math.random() - 0.5) * currentWeapon.spread);
    }
  } else {
    createBullet(currentWeapon, 0);
  }
}

function createBullet(weapon, spreadOffset) {
  let bullet = new THREE.Mesh(
    new THREE.SphereGeometry(weapon.bulletSize, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  bullet.position.copy(camera.position);
  let direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.x += spreadOffset;
  bullet.velocity = direction.multiplyScalar(weapon.bulletSpeed);
  scene.add(bullet);
}

// Game loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
