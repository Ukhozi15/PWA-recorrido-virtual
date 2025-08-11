// src/main.js

import * as THREE from 'three';
import './style.css';
import { FirstPersonControls } from './core/FirstPersonControls.js';
import { initSchoolScene } from './scenes/SchoolScene.js'; 
import { initUIManager, showModalWithData } from './ui/UIManager.js';
import { pointsOfInterest } from './data/pointsData.js';
import { InterestPoint } from './core/InterestPoint.js';

// Las variables globales se mantienen igual
let scene, camera, renderer, controls, clock;
let interactionRaycaster;
const interestPoints_scene = [];
let intersectedPoint = null;
let interactionText;
let actionButton;

// --- LÓGICA DE INICIO PRINCIPAL ---
// Se ejecuta cuando el DOM está completamente cargado.
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const welcomeOverlay = document.getElementById('welcome-overlay');

    if (startButton && welcomeOverlay) {
        startButton.addEventListener('click', async () => {
            // Ocultar la pantalla de bienvenida con una transición suave
            welcomeOverlay.classList.add('hidden');
            
            // Iniciar la experiencia 3D
            await startExperience();
        }, { once: true });
    }

    // --- REGISTRO DEL SERVICE WORKER ---
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registrado con éxito:', registration);
          })
          .catch(error => {
            console.error('Error al registrar el Service Worker:', error);
          });
      });
    }
});

// Esta nueva función centraliza el inicio de la app
async function startExperience() {
    const isTouchDevice = 'ontouchstart' in window;

    // Si es un dispositivo táctil, activa los controles móviles y pide pantalla completa.
    if (isTouchDevice) {
        const mobileControls = document.getElementById('mobile-controls');
        mobileControls.classList.remove('hidden');
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape-primary');
            }
        } catch (err) {
            console.warn(`Error con pantalla completa u orientación: ${err.message}`);
        }
    }
    
    // Lógica de inicialización común para todos los dispositivos
    await initializeBaseScene();
    await loadAssetsAndFinalize();
}


async function initializeBaseScene() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 5);

    const canvas = document.getElementById('webglCanvas');
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    controls = new FirstPersonControls(camera, canvas);
    scene.add(controls.getObject());

    initUIManager(controls.controls);

    interactionRaycaster = new THREE.Raycaster();
    interactionRaycaster.far = 3;
    interactionText = document.getElementById('interaction-text');
    actionButton = document.getElementById('action-button');
    
    window.addEventListener('keydown', handleInteractionKey);
    actionButton.addEventListener('click', handleInteractionAction);

    animate();
}

async function loadAssetsAndFinalize() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    const collisionObjects = await initSchoolScene(scene, renderer);
    controls.setCollisionObjects(collisionObjects);

    pointsOfInterest.forEach(pointData => {
        const point = new InterestPoint(pointData);
        interestPoints_scene.push(point);
        scene.add(point);
    });

    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}


function checkInterestPoints() {
    if (!interactionRaycaster || !camera || interestPoints_scene.length === 0) return;

    interactionRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = interactionRaycaster.intersectObjects(interestPoints_scene);

    if (intersects.length > 0) {
        intersectedPoint = intersects[0].object;
    } else {
        intersectedPoint = null;
    }
    
    const canInteract = !!intersectedPoint;
    interactionText.classList.toggle('hidden', !canInteract);
    if (actionButton) {
        actionButton.classList.toggle('active', canInteract);
    }
}

function handleInteractionKey(event) {
    if (event.code === 'KeyE') {
        handleInteractionAction();
    }
}

function handleInteractionAction() {
    if (intersectedPoint) {
        showModalWithData(intersectedPoint.pointData);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (controls) {
        controls.update(delta);
    }

    checkInterestPoints();
    renderer.render(scene, camera);
}

function handleResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.addEventListener('resize', handleResize);
