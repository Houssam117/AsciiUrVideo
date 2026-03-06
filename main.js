import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ASCII Configuration
const TEXT_DENSITY = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'; // high detail gradient
const FONT_SIZE = 10;
const CELL_WIDTH = 6;
const CELL_HEIGHT = 10;

const canvas = document.getElementById('ascii-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let scene, camera, renderer, renderTarget;
let controls;
let planetGroup;
let currentPlanetType = 'saturn';
let cols, rows;

const lights = [];
const clock = new THREE.Clock();
let isInitialized = false;

init();
animate();

function init() {
    // Basic setup
    resize();
    window.addEventListener('resize', resize);

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    // Keep it entirely offscreen

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Correct aspect ratio considering cells are completely differently proportioned than pixels
    camera = new THREE.PerspectiveCamera(45, (cols * CELL_WIDTH) / (rows * CELL_HEIGHT), 0.1, 1000);
    camera.position.set(0, 15, 30);

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    setupLights();
    buildPlanet(currentPlanetType);

    document.getElementById('btn-earth').addEventListener('click', () => switchPlanet('earth'));
    document.getElementById('btn-mars').addEventListener('click', () => switchPlanet('mars'));
    document.getElementById('btn-venus').addEventListener('click', () => switchPlanet('venus'));
    document.getElementById('btn-saturn').addEventListener('click', () => switchPlanet('saturn'));

    createRenderTargets();

    const loadEl = document.getElementById('loading');
    if (loadEl) {
        loadEl.style.opacity = '0';
        setTimeout(() => loadEl.remove(), 500);
    }

    isInitialized = true;
}

function createRenderTargets() {
    if (renderTarget) renderTarget.dispose();
    renderTarget = new THREE.WebGLRenderTarget(cols, rows, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
    });

    // update camera aspect ratio inside renderer based on the actual cols/rows
    if (camera) {
        camera.aspect = cols / rows; // Viewport aspect ratio matches grid resolution exactly!
        camera.updateProjectionMatrix();
    }
}

function switchPlanet(type) {
    if (type === currentPlanetType && isInitialized) return; // Allow initial build even if not initialized

    // Update active button
    document.querySelectorAll('#planet-controls button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');

    currentPlanetType = type;

    // Remove old planet group
    if (planetGroup) {
        scene.remove(planetGroup);
    }

    buildPlanet(type);
}

function buildPlanet(type) {
    planetGroup = new THREE.Group();
    scene.add(planetGroup);

    let pGeo, pMat, mesh, rGeo, rMat, rings;

    switch (type) {
        case 'earth':
            pGeo = new THREE.SphereGeometry(6, 128, 128);
            pMat = new THREE.MeshStandardMaterial({
                color: 0x4466ff,
                roughness: 0.6,
                metalness: 0.2,
            });
            mesh = new THREE.Mesh(pGeo, pMat);
            planetGroup.add(mesh);

            const mGeo = new THREE.SphereGeometry(1.5, 64, 64);
            const mMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
            const moon = new THREE.Mesh(mGeo, mMat);
            moon.position.set(10, 0, 0);

            const moonPivot = new THREE.Group();
            moonPivot.add(moon);
            moonPivot.userData.isMoonPivot = true;
            moonPivot.userData.orbitSpeed = 0.5;
            planetGroup.add(moonPivot);

            planetGroup.rotation.z = 23.5 * (Math.PI / 180);
            break;

        case 'mars':
            pGeo = new THREE.SphereGeometry(4, 128, 128);
            pMat = new THREE.MeshStandardMaterial({
                color: 0xff3300,
                roughness: 0.9,
                metalness: 0.1,
            });
            mesh = new THREE.Mesh(pGeo, pMat);
            planetGroup.add(mesh);

            const m1Geo = new THREE.SphereGeometry(0.6, 32, 32);
            const m1Mat = new THREE.MeshStandardMaterial({ color: 0xaa6655, roughness: 1.0 });
            const m1 = new THREE.Mesh(m1Geo, m1Mat);
            m1.position.set(6, 0, 0);
            const p1 = new THREE.Group();
            p1.add(m1);
            p1.userData.isMoonPivot = true;
            p1.userData.orbitSpeed = 1.5;
            planetGroup.add(p1);

            const m2Geo = new THREE.SphereGeometry(0.4, 32, 32);
            const m2Mat = new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 1.0 });
            const m2 = new THREE.Mesh(m2Geo, m2Mat);
            m2.position.set(8, 0, 0);
            const p2 = new THREE.Group();
            p2.add(m2);
            p2.userData.isMoonPivot = true;
            p2.userData.orbitSpeed = 0.8;
            planetGroup.add(p2);

            planetGroup.rotation.z = 25.2 * (Math.PI / 180);
            break;

        case 'venus':
            pGeo = new THREE.SphereGeometry(5.8, 128, 128);
            pMat = new THREE.MeshStandardMaterial({
                color: 0xffcc77,
                roughness: 0.3,
                metalness: 0.1,
            });
            mesh = new THREE.Mesh(pGeo, pMat);
            planetGroup.add(mesh);

            planetGroup.rotation.z = 2.64 * (Math.PI / 180);
            break;

        case 'saturn':
        default:
            pGeo = new THREE.SphereGeometry(6, 128, 128);
            pMat = new THREE.MeshStandardMaterial({
                color: 0xffeebb,
                roughness: 0.7,
                metalness: 0.1,
            });
            mesh = new THREE.Mesh(pGeo, pMat);
            planetGroup.add(mesh);

            rGeo = new THREE.RingGeometry(7.5, 14, 256);
            rMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                roughness: 0.4
            });
            rings = new THREE.Mesh(rGeo, rMat);
            rings.rotation.x = Math.PI / 2;
            planetGroup.add(rings);

            planetGroup.rotation.z = 26.7 * (Math.PI / 180);
            break;
    }
}

function setupLights() {
    // Ambient light - darker for more contrast
    scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    // Trippy orbiting point lights
    // More intense colors
    const colors = [0xff0055, 0x00ffaa, 0x5500ff, 0xffaa00, 0x00ffff, 0xff00ff];
    for (let i = 0; i < 6; i++) {
        const light = new THREE.PointLight(colors[i], 1500, 100);
        scene.add(light);
        lights.push({
            light,
            angle: (i / 6) * Math.PI * 2,
            speed: 0.8 + Math.random(),
            radius: 14 + Math.random() * 8,
            height: (Math.random() - 0.5) * 15
        });
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    cols = Math.ceil(canvas.width / CELL_WIDTH);
    rows = Math.ceil(canvas.height / CELL_HEIGHT);

    if (isInitialized) {
        createRenderTargets();
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!isInitialized) return;

    const time = clock.getElapsedTime();

    // Rotate planet slowly
    if (planetGroup) {
        planetGroup.rotation.y = time * 0.2;

        // Rotate moons independently
        planetGroup.children.forEach(child => {
            if (child.userData.isMoonPivot) {
                child.rotation.y = time * child.userData.orbitSpeed;
            }
        });

        // Gentle floating
        planetGroup.position.y = Math.sin(time * 0.5) * 0.5;
    }

    // Move trippy lights
    lights.forEach((l, i) => {
        l.angle += l.speed * 0.02;
        l.light.position.x = Math.cos(l.angle) * l.radius;
        l.light.position.z = Math.sin(l.angle) * l.radius;
        l.light.position.y = l.height + Math.sin(time * 2 + l.angle) * 5;

        // Pulse light intensity for trippy effect
        l.light.intensity = 1500 + Math.sin(time * 5 + i) * 500;
    });

    controls.update();

    // 1. Render to target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    // 2. Read pixels
    const buffer = new Uint8Array(cols * rows * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, cols, rows, buffer);

    // 3. Draw ASCII
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Slight shadow to characters for realism/glow
    ctx.shadowBlur = 2;
    ctx.font = `bold ${FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // WebGL readRenderTargetPixels reads inverted Y axis (bottom-left to top-right)
            const invertY = rows - 1 - y;
            const i = (invertY * cols + x) * 4;

            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];

            // Avoid fully black background to save draw calls
            if (r < 4 && g < 4 && b < 4) continue;

            // Compute luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
            if (luminance < 2) continue;

            // Map luminance to character
            const charIndex = Math.max(0, Math.min(TEXT_DENSITY.length - 1, Math.floor((luminance / 255) * TEXT_DENSITY.length)));
            const char = TEXT_DENSITY[charIndex];

            // High contrast vibrant colors
            ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
            ctx.fillStyle = `rgb(${Math.min(255, r * 1.8)}, ${Math.min(255, g * 1.8)}, ${Math.min(255, b * 1.8)})`;
            ctx.fillText(char, x * CELL_WIDTH, y * CELL_HEIGHT);
        }
    }
}
