import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
// Initialize Supabase client
const supabaseUrl = 'https://jtsfaniuhustvhkclvjz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c2Zhbml1aHVzdHZoa2NsdmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMxMzMyODEsImV4cCI6MjAxODcwOTI4MX0.YKZDxk0wT5Y0ZEgf6oxyRIZE2dyOE6fJyFWzgAiNzYg';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
// Game configuration
const CHANNEL_NAME = 'game_updates';
const FPSGame = () => {
 const wsRef = useRef(null);
 const [players, setPlayers] = useState({});
 const mountRef = useRef(null);
 const [currentWeapon, setCurrentWeapon] = useState(0);
 const [ammo, setAmmo] = useState({ 0: 30, 1: 45, 2: 5, 3: 10, 4: 60 });
 const [cameraView, setCameraView] = useState('fps'); // fps, thirdPerson, tactical
 const [health, setHealth] = useState(100);
 const [shield, setShield] = useState(50);
 const [healthRegen, setHealthRegen] = useState(0);
 const [isJumping, setIsJumping] = useState(false);
 const [lastDamaged, setLastDamaged] = useState(0);
 const [canWallRun, setCanWallRun] = useState(true);
 const [isWallRunning, setIsWallRunning] = useState(false);
 const [score, setScore] = useState(0);
 const [lastDatabaseUpdate, setLastDatabaseUpdate] = useState(0);
 const [gameChannel, setGameChannel] = useState(null);
 const weapons = [
 { 
 name: 'Pistol', 
 damage: 34, 
 fireRate: 100, 
 model: null, 
 bulletSpeed: 2, 
 bulletColor: 0xffff00, 
 recoil: 0.01,
 specialAbility: {
 name: 'Quick Reload',
 cooldown: 5000,
 duration: 2000,
 isActive: false,
 lastUsed: 0
 }
 },
 { 
 name: 'Rifle', 
 damage: 25, 
 fireRate: 50, 
 model: null, 
 bulletSpeed: 3, 
 bulletColor: 0xff0000, 
 recoil: 0.02,
 specialAbility: {
 name: 'Rapid Fire',
 cooldown: 8000,
 duration: 3000,
 isActive: false,
 lastUsed: 0
 }
 },
 { 
 name: 'Shotgun', 
 damage: 100, 
 fireRate: 800, 
 model: null, 
 bulletSpeed: 1.5, 
 bulletColor: 0xffa500, 
 recoil: 0.05,
 specialAbility: {
 name: 'Super Spread',
 cooldown: 10000,
 duration: 4000,
 isActive: false,
 lastUsed: 0
 }
 }
 ];

 useEffect(() => {
 let gameChannel;
 
 const setupRealtime = async () => {
 try {
 // Initialize Supabase realtime channel
 gameChannel = supabase
 .channel(CHANNEL_NAME)
 .on('broadcast', { event: 'player_update' }, (payload) => {
 const data = payload.payload;
 setPlayers(prev => ({
 ...prev,
 [data.id]: {
 position: new THREE.Vector3().fromArray(data.position),
 rotation: new THREE.Euler().fromArray(data.rotation),
 health: data.health,
 score: data.score
 }
 }));
 })
 .on('broadcast', { event: 'player_left' }, (payload) => {
 const data = payload.payload;
 setPlayers(prev => {
 const newPlayers = {...prev};
 delete newPlayers[data.id];
 return newPlayers;
 });
 })
 .subscribe();
 // Initialize player in database
 const { data: { session } } = await supabase.auth.getSession();
 if (session?.user) {
 await supabase
 .from('players')
 .upsert({
 id: session.user.id,
 last_seen: new Date().toISOString(),
 score: 0,
 health: 100,
 shield: 50
 });
 }
 } catch (error) {
 console.error('Error setting up realtime:', error);
 }
 };
 
 setupRealtime();
 
 // Scene setup
 const scene = new THREE.Scene();
 scene.background = new THREE.Color(0x87ceeb);
 const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
 const renderer = new THREE.WebGLRenderer();
 renderer.setSize(window.innerWidth, window.innerHeight);
 mountRef.current.appendChild(renderer.domElement);

 // Player setup
 const player = new THREE.Group();
 camera.position.set(0, 2, 5);
 player.add(camera);
 scene.add(player);
 
 // Add hitbox to player
 player.hitbox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
 player.hitbox.setFromObject(player);

 // Weapons setup
 const weaponModels = [];
 
 // Pistol (more detailed geometry)
 const pistolGroup = new THREE.Group();
 const pistolBody = new THREE.Mesh(
 new THREE.BoxGeometry(0.1, 0.15, 0.3),
 new THREE.MeshPhongMaterial({ color: 0x333333 })
 );
 const pistolGrip = new THREE.Mesh(
 new THREE.BoxGeometry(0.08, 0.2, 0.1),
 new THREE.MeshPhongMaterial({ color: 0x222222 })
 );
 pistolGrip.position.y = -0.15;
 pistolGroup.add(pistolBody, pistolGrip);
 pistolGroup.position.set(0.3, -0.3, -0.5);
 weaponModels[0] = pistolGroup;
 
 // Rifle (more detailed geometry)
 const rifleGroup = new THREE.Group();
 const rifleBody = new THREE.Mesh(
 new THREE.BoxGeometry(0.1, 0.15, 0.6),
 new THREE.MeshPhongMaterial({ color: 0x666666 })
 );
 const rifleStock = new THREE.Mesh(
 new THREE.BoxGeometry(0.08, 0.2, 0.2),
 new THREE.MeshPhongMaterial({ color: 0x8B4513 })
 );
 rifleStock.position.set(0, -0.1, 0.2);
 const rifleSight = new THREE.Mesh(
 new THREE.BoxGeometry(0.02, 0.05, 0.02),
 new THREE.MeshPhongMaterial({ color: 0x111111 })
 );
 rifleSight.position.set(0, 0.1, -0.2);
 rifleGroup.add(rifleBody, rifleStock, rifleSight);
 rifleGroup.position.set(0.3, -0.3, -0.7);
 weaponModels[1] = rifleGroup;
 
 // Shotgun
 const shotgunGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.5);
 const shotgunMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
 const shotgun = new THREE.Mesh(shotgunGeometry, shotgunMaterial);
 shotgun.position.set(0.3, -0.3, -0.6);
 weaponModels[2] = shotgun;
 
 // Add initial weapon to camera
 camera.add(weaponModels[currentWeapon]);

 // Advanced map setup
 const mapGeometry = new THREE.PlaneGeometry(100, 100);
 const mapMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
 const floor = new THREE.Mesh(mapGeometry, mapMaterial);
 floor.rotation.x = -Math.PI / 2;
 scene.add(floor);
 
 // Buildings and obstacles
 const createBuilding = (x, z, width, height, depth) => {
 const geometry = new THREE.BoxGeometry(width, height, depth);
 const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
 const building = new THREE.Mesh(geometry, material);
 building.position.set(x, height/2, z);
 scene.add(building);
 return building;
 };
 
 // Create map layout
 // Create platforms
 const createPlatform = (x, y, z, width, height, depth, isMoving = false) => {
 const geometry = new THREE.BoxGeometry(width, height, depth);
 const material = new THREE.MeshPhongMaterial({ 
 color: 0x4287f5,
 metalness: 0.5,
 roughness: 0.5
 });
 const platform = new THREE.Mesh(geometry, material);
 platform.position.set(x, y, z);
 if (isMoving) {
 platform.userData.isMoving = true;
 platform.userData.startPosition = { x, y, z };
 platform.userData.moveDirection = 1;
 platform.userData.moveSpeed = 0.03;
 platform.userData.moveDistance = 5;
 }
 // Add hitbox
 platform.hitbox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
 platform.hitbox.setFromObject(platform);
 scene.add(platform);
 return platform;
 };
 const platforms = [
 createPlatform(-15, 5, -15, 4, 0.5, 4, true), // Moving platform
 createPlatform(15, 8, 15, 4, 0.5, 4), // Static platform
 createPlatform(0, 12, 0, 6, 0.5, 6), // Central platform
 createPlatform(-10, 15, 10, 3, 0.5, 3, true), // High moving platform
 ];
 const buildings = [
 createBuilding(-20, -20, 10, 15, 10),
 createBuilding(20, -20, 8, 12, 8),
 createBuilding(-20, 20, 12, 10, 12),
 createBuilding(20, 20, 15, 8, 15)
 ];
 
 // Barriers
 const createBarrier = (x, z, rotation) => {
 const geometry = new THREE.BoxGeometry(5, 2, 0.5);
 const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
 const barrier = new THREE.Mesh(geometry, material);
 barrier.position.set(x, 1, z);
 barrier.rotation.y = rotation;
 scene.add(barrier);
 return barrier;
 };
 
 // Add barriers around the map
 const barriers = [
 createBarrier(0, 10, 0),
 createBarrier(-10, 0, Math.PI / 2),
 createBarrier(10, -5, Math.PI / 4),
 createBarrier(-5, -10, -Math.PI / 4)
 ];

 // Lighting
 const light = new THREE.DirectionalLight(0xffffff, 1);
 light.position.set(0, 10, 0);
 scene.add(light);
 scene.add(new THREE.AmbientLight(0x404040));

 // Enemy setup
 const enemies = [];
 function createEnemy() {
 const enemyGroup = new THREE.Group();
 enemyGroup.userData = {
 health: 100,
 lastShot: 0,
 fireRate: 1000,
 state: 'chase', // chase, attack, or retreat
 animationFrame: 0,
 animationSpeed: 0.1,
 };
 
 // Add hitbox to enemy
 enemyGroup.hitbox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
 
 // Enhanced enemy body
 const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
 const bodyMaterial = new THREE.MeshStandardMaterial({ 
 color: 0xff0000,
 metalness: 0.3,
 roughness: 0.7,
 emissive: 0x330000,
 emissiveIntensity: 0.2
 });
 const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
 
 // Enemy head
 const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
 const headMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
 const head = new THREE.Mesh(headGeometry, headMaterial);
 head.position.y = 1;
 
 // Enemy arms
 const armGeometry = new THREE.CapsuleGeometry(0.15, 0.5, 4, 8);
 const armMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
 const leftArm = new THREE.Mesh(armGeometry, armMaterial);
 const rightArm = new THREE.Mesh(armGeometry, armMaterial);
 leftArm.position.set(-0.7, 0.2, 0);
 rightArm.position.set(0.7, 0.2, 0);
 leftArm.rotation.z = Math.PI / 3;
 rightArm.rotation.z = -Math.PI / 3;
 
 enemyGroup.add(body, head, leftArm, rightArm);
 const enemy = enemyGroup;
 enemy.position.set(
 Math.random() * 40 - 20,
 1,
 Math.random() * 40 - 20
 );
 enemy.health = 100;
 scene.add(enemy);
 enemies.push(enemy);
 }

 // Create initial enemies
 for (let i = 0; i < 5; i++) {
 createEnemy();
 }

 // Movement controls
 const keys = {};
 const moveSpeed = 0.15;
 const rotationSpeed = 0.02;
 const jumpForce = 0.5;
 const gravity = 0.02;
 let verticalVelocity = 0;
 player.position.y = 2; // Initial player height

 // Camera positions
 const cameraPositions = {
 fps: { x: 0, y: 2, z: 0 },
 thirdPerson: { x: 0, y: 3, z: 5 },
 tactical: { x: 0, y: 10, z: 0 }
 };
 // Movement, weapon, and camera controls
 window.addEventListener('keydown', (e) => {
 // Special ability activation (Right Click)
 if (e.key === 'e') {
 const weapon = weapons[currentWeapon];
 const now = Date.now();
 if (now - weapon.specialAbility.lastUsed >= weapon.specialAbility.cooldown) {
 weapon.specialAbility.isActive = true;
 weapon.specialAbility.lastUsed = now;
 
 // Apply special ability effects
 switch(weapon.name) {
 case 'Pistol':
 // Instant reload
 setAmmo(prev => ({...prev, [currentWeapon]: 30}));
 break;
 case 'Rifle':
 // Temporary increase fire rate
 weapon.fireRate /= 2;
 setTimeout(() => {
 weapon.fireRate *= 2;
 }, weapon.specialAbility.duration);
 break;
 case 'Shotgun':
 // Temporary increase spread and damage
 weapon.damage *= 1.5;
 setTimeout(() => {
 weapon.damage /= 1.5;
 }, weapon.specialAbility.duration);
 break;
 }
 
 // Deactivate ability after duration
 setTimeout(() => {
 weapon.specialAbility.isActive = false;
 }, weapon.specialAbility.duration);
 }
 }
 
 // Camera view switching
 if (e.key === 'v') {
 setCameraView(prev => {
 const views = ['fps', 'thirdPerson', 'tactical'];
 const currentIndex = views.indexOf(prev);
 const nextIndex = (currentIndex + 1) % views.length;
 const newView = views[nextIndex];
 
 // Update camera position
 const pos = cameraPositions[newView];
 camera.position.set(pos.x, pos.y, pos.z);
 
 if (newView === 'fps') {
 camera.rotation.x = 0;
 } else if (newView === 'tactical') {
 camera.rotation.x = -Math.PI / 2;
 }
 
 return newView;
 });
 }
 keys[e.key] = true;
 
 // Weapon switching
 if (e.key >= '1' && e.key <= '3') {
 const weaponIndex = parseInt(e.key) - 1;
 if (weaponIndex !== currentWeapon) {
 camera.remove(weaponModels[currentWeapon]);
 camera.add(weaponModels[weaponIndex]);
 setCurrentWeapon(weaponIndex);
 }
 }
 });
 window.addEventListener('keyup', (e) => keys[e.key] = false);

 // Mouse look
 let isPointerLocked = false;
 renderer.domElement.addEventListener('click', () => {
 renderer.domElement.requestPointerLock();
 });

 document.addEventListener('pointerlockchange', () => {
 isPointerLocked = document.pointerLockElement === renderer.domElement;
 });

 document.addEventListener('mousemove', (e) => {
 if (isPointerLocked) {
 player.rotation.y -= e.movementX * 0.002;
 camera.rotation.x = Math.max(
 -Math.PI/2,
 Math.min(Math.PI/2, camera.rotation.x - e.movementY * 0.002)
 );
 }
 });

 // Shooting
 let canShoot = true;
 let muzzleFlash = null;
 
 // Create muzzle flash
 const createMuzzleFlash = () => {
 const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
 const flashMaterial = new THREE.MeshBasicMaterial({ 
 color: 0xffff00,
 transparent: true,
 opacity: 0.8
 });
 const flash = new THREE.Mesh(flashGeometry, flashMaterial);
 return flash;
 };
 // Bullet pool
 const bullets = [];
 const createBullet = (position, direction, weaponType, isEnemyBullet = false) => {
 const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
 const bulletMaterial = new THREE.MeshPhongMaterial({ 
 color: weapons[weaponType].bulletColor,
 emissive: weapons[weaponType].bulletColor,
 emissiveIntensity: 0.5
 });
 const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
 bullet.position.copy(position);
 bullet.direction = direction;
 bullet.weaponType = weaponType;
 bullet.distance = 0;
 bullet.maxDistance = 100;
 scene.add(bullet);
 bullets.push(bullet);
 };
 renderer.domElement.addEventListener('click', () => {
 if (canShoot && ammo[currentWeapon] > 0) {
 // Raycast for shooting
 const raycaster = new THREE.Raycaster();
 raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

 // Create bullet
 const bulletStart = new THREE.Vector3();
 camera.getWorldPosition(bulletStart);
 const bulletDirection = new THREE.Vector3();
 camera.getWorldDirection(bulletDirection);
 
 if (currentWeapon === 2) { // Shotgun spread
 for (let i = 0; i < 5; i++) {
 const spread = new THREE.Vector3(
 bulletDirection.x + (Math.random() - 0.5) * 0.1,
 bulletDirection.y + (Math.random() - 0.5) * 0.1,
 bulletDirection.z + (Math.random() - 0.5) * 0.1
 ).normalize();
 createBullet(bulletStart.clone(), spread, currentWeapon);
 }
 } else {
 createBullet(bulletStart, bulletDirection, currentWeapon);
 }
 const intersects = raycaster.intersectObjects(enemies);
 if (intersects.length > 0) {
 const hitEnemy = intersects[0].object;
 hitEnemy.health -= weapons[currentWeapon].damage;
 if (hitEnemy.health <= 0) {
 scene.remove(hitEnemy);
 enemies.splice(enemies.indexOf(hitEnemy), 0);
 setScore(prev => prev + 100);
 createEnemy(); // Spawn new enemy
 }
 }

 // Update ammo
 setAmmo(prev => ({
 ...prev,
 [currentWeapon]: prev[currentWeapon] - 1
 }));
 // Muzzle flash effect
 if (!muzzleFlash) {
 muzzleFlash = createMuzzleFlash();
 }
 const currentWeaponModel = weaponModels[currentWeapon];
 muzzleFlash.position.set(
 currentWeaponModel.position.x,
 currentWeaponModel.position.y,
 currentWeaponModel.position.z - 0.5
 );
 camera.add(muzzleFlash);
 
 setTimeout(() => {
 camera.remove(muzzleFlash);
 }, 50);
 // Weapon cooldown
 canShoot = false;
 setTimeout(() => { 
 canShoot = true; 
 }, weapons[currentWeapon].fireRate);
 }
 });

 // Game loop
 function animate() {
 requestAnimationFrame(animate);
 
 // Update player hitbox
 player.hitbox.setFromObject(player);
 
 // Health and shield regeneration
 const now = Date.now();
 if (now - lastDamaged > 5000) { // Start regenerating 5 seconds after last damage
 if (health < 100) {
 setHealth(prev => Math.min(100, prev + 0.1));
 } else if (shield < 50) {
 setShield(prev => Math.min(50, prev + 0.2));
 }
 }
 
 // Update moving platforms
 platforms.forEach(platform => {
 if (platform.userData.isMoving) {
 const { startPosition, moveDirection, moveSpeed, moveDistance } = platform.userData;
 
 platform.position.y += moveSpeed * moveDirection;
 
 const distanceFromStart = Math.abs(platform.position.y - startPosition.y);
 
 if (distanceFromStart > moveDistance) {
 platform.userData.moveDirection *= -1;
 }
 
 // Update platform hitbox
 platform.userData.hitbox.setFromObject(platform);
 
 // Check if player is on platform
 if (player.position.distanceTo(platform.position) < 3 && 
 Math.abs(player.position.y - (platform.position.y + 1)) < 0.5) {
 player.position.y = platform.position.y + 1;
 }
 }
 });
 
 // Update bullets
 for (let i = bullets.length - 1; i >= 0; i--) {
 const bullet = bullets[i];
 const moveAmount = weapons[bullet.weaponType].bulletSpeed;
 bullet.position.add(bullet.direction.multiplyScalar(moveAmount));
 bullet.distance += moveAmount;
 
 // Check bullet collisions with enemies
 enemies.forEach(enemy => {
 enemy.hitbox.setFromObject(enemy);
 if (enemy.hitbox.containsPoint(bullet.position)) {
 enemy.userData.health -= weapons[bullet.weaponType].damage;
 scene.remove(bullet);
 bullets.splice(i, 1);
 
 if (enemy.userData.health <= 0) {
 scene.remove(enemy);
 enemies.splice(enemies.indexOf(enemy), 1);
 setScore(prev => prev + 100);
 createEnemy();
 }
 }
 });
 
 // Remove bullets that have traveled too far
 if (bullet.distance > bullet.maxDistance) {
 scene.remove(bullet);
 bullets.splice(i, 1);
 }
 }

 // Player movement and parkour mechanics
 if (!isWallRunning) {
 verticalVelocity -= gravity;
 
 // Create player hitbox
 const playerHitbox = new THREE.Box3().setFromObject(player);
 playerHitbox.min.y += verticalVelocity; // Apply vertical velocity to hitbox
 
 let isOnPlatform = false;
 
 // Check collision with platforms
 platforms.forEach(platform => {
 platform.hitbox.setFromObject(platform);
 if (player.hitbox.intersectsBox(platform.hitbox)) {
 if (verticalVelocity < 0) { // Player is falling
 player.position.y = platform.position.y + platform.geometry.parameters.height / 2 + 1;
 verticalVelocity = 0;
 setIsJumping(false);
 isOnPlatform = true;
 } else { // Player is jumping
 verticalVelocity = 0;
 }
 }
 });
 
 // Ground check
 if (player.position.y <= 2 && !isOnPlatform) {
 player.position.y = 2;
 verticalVelocity = 0;
 setIsJumping(false);
 } else {
 player.position.y += verticalVelocity;
 }
 }
 
 // Wall run detection
 const wallCheckDistance = 1;
 const wallRunHeight = 4;
 const wallRunDuration = 1500;
 
 // Basic movement
 if (keys['w']) {
 player.translateZ(-moveSpeed);
 }
 if (keys['s']) {
 player.translateZ(moveSpeed);
 }
 if (keys['a']) {
 player.translateX(-moveSpeed);
 }
 if (keys['d']) {
 player.translateX(moveSpeed);
 }
 
 // Jump
 if (keys[' '] && !isJumping) {
 verticalVelocity = jumpForce;
 setIsJumping(true);
 }
 
 // Wall run
 if (keys['w'] && keys['ShiftLeft'] && canWallRun) {
 // Check for walls on both sides
 const leftWallCheck = new THREE.Raycaster(
 player.position,
 new THREE.Vector3(-1, 0, 0),
 0,
 wallCheckDistance
 );
 
 const rightWallCheck = new THREE.Raycaster(
 player.position,
 new THREE.Vector3(1, 0, 0),
 0,
 wallCheckDistance
 );
 
 const leftIntersects = leftWallCheck.intersectObjects(buildings);
 const rightIntersects = rightWallCheck.intersectObjects(buildings);
 
 if (leftIntersects.length > 0 || rightIntersects.length > 0) {
 setIsWallRunning(true);
 player.position.y = wallRunHeight;
 verticalVelocity = 0;
 
 // Disable wall running after duration
 setTimeout(() => {
 setIsWallRunning(false);
 setCanWallRun(false);
 setTimeout(() => setCanWallRun(true), 1000); // Wall run cooldown
 }, wallRunDuration);
 }
 }

 // Enemy AI
 enemies.forEach(enemy => {
 // Enemy AI state machine and animation
 enemy.userData.animationFrame += enemy.userData.animationSpeed;
 
 // Animate enemy parts based on state
 const bounce = Math.sin(enemy.userData.animationFrame) * 0.1;
 enemy.position.y = 1 + bounce;
 
 // Get enemy parts for animation
 const [body, head, leftArm, rightArm] = enemy.children;
 leftArm.rotation.x = Math.sin(enemy.userData.animationFrame) * 0.5;
 rightArm.rotation.x = Math.sin(enemy.userData.animationFrame + Math.PI) * 0.5;
 
 const distanceToPlayer = enemy.position.distanceTo(player.position);
 const direction = new THREE.Vector3();
 direction.subVectors(player.position, enemy.position);
 direction.normalize();
 
 // Enemy state machine
 switch(enemy.userData.state) {
 case 'chase':
 if (distanceToPlayer < 15) {
 enemy.userData.state = 'attack';
 } else {
 enemy.position.add(direction.multiplyScalar(0.05));
 }
 break;
 
 case 'attack':
 if (distanceToPlayer > 20) {
 enemy.userData.state = 'chase';
 } else if (distanceToPlayer < 8) {
 enemy.userData.state = 'retreat';
 } else {
 // Shoot at player
 const now = Date.now();
 if (now - enemy.userData.lastShot > enemy.userData.fireRate) {
 const bulletStart = enemy.position.clone();
 const bulletDirection = direction.clone();
 
 // Add slight inaccuracy to enemy shots
 bulletDirection.x += (Math.random() - 0.5) * 0.1;
 bulletDirection.y += (Math.random() - 0.5) * 0.1;
 bulletDirection.z += (Math.random() - 0.5) * 0.1;
 
 createBullet(bulletStart, bulletDirection, 0, true);
 enemy.userData.lastShot = now;
 }
 }
 break;
 
 case 'retreat':
 if (distanceToPlayer > 12) {
 enemy.userData.state = 'attack';
 } else {
 enemy.position.add(direction.multiplyScalar(-0.03));
 }
 break;
 }
 
 enemy.lookAt(player.position);

 // Enemy collision and damage check
 enemy.hitbox.setFromObject(enemy);
 if (player.hitbox.intersectsBox(enemy.hitbox)) {
 const now = Date.now();
 setLastDamaged(now);
 
 // Check shield first
 if (shield > 0) {
 setShield(prev => Math.max(0, prev - 3));
 } else {
 setHealth(prev => {
 const newHealth = Math.max(0, prev - 5);
 if (newHealth === 0) {
 handleGameOver();
 }
 return newHealth;
 });
 }
 }
 });

 // Broadcast player position through Supabase
 if (gameChannel) {
 gameChannel.send({
 type: 'broadcast',
 event: 'player_update',
 payload: {
 position: player.position.toArray(),
 rotation: player.rotation.toArray(),
 health: health,
 shield: shield,
 score: score
 }
 });
 
 // Update player stats in database periodically
 const now = Date.now();
 if (now - lastDatabaseUpdate > 5000) { // Update every 5 seconds
 const updatePlayerStats = async () => {
 try {
 const { data: { session } } = await supabase.auth.getSession();
 if (session?.user) {
 await supabase
 .from('players')
 .update({
 last_seen: new Date().toISOString(),
 score: score,
 health: health,
 shield: shield
 })
 .eq('id', session.user.id);
 }
 setLastDatabaseUpdate(now);
 } catch (error) {
 console.error('Error updating player stats:', error);
 }
 };
 
 updatePlayerStats();
 }
 }
 
 renderer.render(scene, camera);
 }
 animate();

 // Cleanup
 return () => {
 if (gameChannel) {
 gameChannel.unsubscribe();
 }
 mountRef.current.removeChild(renderer.domElement);
 renderer.dispose();
 };
 }, []);

 return (
 <div ref={mountRef}>
 <div style={{
 position: 'absolute',
 padding: '20px',
 color: 'white',
 fontFamily: 'Arial',
 userSelect: 'none'
 }}>
 <div>Health: {Math.floor(health)} / 100</div>
 <div>Shield: {Math.floor(shield)} / 50</div>
 <div>Weapon: {weapons[currentWeapon].name}</div>
 <div>Ammo: {ammo[currentWeapon]}</div>
 <div>Special: {weapons[currentWeapon].specialAbility.name} 
 {weapons[currentWeapon].specialAbility.isActive ? ' (ACTIVE)' : 
 Date.now() - weapons[currentWeapon].specialAbility.lastUsed < 
 weapons[currentWeapon].specialAbility.cooldown ? 
 ' (COOLDOWN)' : ' (READY)'}
 </div>
 <div>Camera: {cameraView}</div>
 <div>Score: {score}</div>
 <div style={{ fontSize: '12px', marginTop: '10px' }}>
 Press 1-3 to switch weapons
 </div>
 </div>
 <div style={{
 position: 'absolute',
 top: '50%',
 left: '50%',
 transform: 'translate(-50%, -50%)',
 color: 'white',
 fontSize: '20px'
 }}>
 +
 </div>
 </div>
 );
};

const App = () => {
 return <FPSGame />;
};

const container = document.getElementById('renderDiv');
const root = ReactDOM.createRoot(container);
root.render(<App />);
