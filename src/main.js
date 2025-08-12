// src/main.js

import * as THREE from 'three';
import './style.css';
import { FirstPersonControls } from './core/FirstPersonControls.js';
import { initSchoolScene } from './scenes/SchoolScene.js'; 
import { initUIManager, showModalWithData } from './ui/UIManager.js';
import { pointsOfInterest } from './data/pointsData.js';
import { InterestPoint } from './core/InterestPoint.js';

// Global variables
let scene, camera, renderer, controls, clock;
let interactionRaycaster;
const interestPoints_scene = [];
let intersectedPoint = null;
let interactionText;
let actionButton;
let isTouchDevice;

// --- MAIN START LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const welcomeOverlay = document.getElementById('welcome-overlay');

    if (startButton && welcomeOverlay) {
        startButton.addEventListener('click', async () => {
            welcomeOverlay.classList.add('hidden');
            await startExperience();
        }, { once: true });
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('Service Worker registered successfully:', registration))
          .catch(error => console.error('Error registering Service Worker:', error));
      });
    }
});

async function startExperience() {
    isTouchDevice = 'ontouchstart' in window;

    if (isTouchDevice) {
        const mobileControls = document.getElementById('mobile-controls');
        mobileControls.classList.remove('hidden');
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.warn(`Error with fullscreen: ${err.message}`);
        }
    }
    
    initializeBaseScene();
    await loadAssetsAndFinalize();

    animate();

    if (!isTouchDevice && controls) {
        controls.controls.lock();
    }
}


function initializeBaseScene() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // ✨ CAMBIO: La cámara ahora es un hijo del objeto de control.
    // Esto es crucial para que el head-bob funcione correctamente sin afectar la posición física.
    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.getObject().add(camera); 
    
    scene.add(controls.getObject());

    initUIManager(controls.controls);

    interactionRaycaster = new THREE.Raycaster();
    interactionRaycaster.far = 3;
    interactionText = document.getElementById('interaction-text');
    actionButton = document.getElementById('action-button');
    
    const modalCloseButton = document.getElementById('modal-close-button');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', () => {
            if (!isTouchDevice) {
                controls.controls.lock();
            }
        });
    }

    const exitButton = document.getElementById('exit-button');
    if (exitButton) {
        const eventType = isTouchDevice ? 'touchend' : 'click';
        exitButton.addEventListener(eventType, handleExitGame);
    }

    window.addEventListener('keydown', handleInteractionKey);
    actionButton.addEventListener('click', handleInteractionAction);
    window.addEventListener('resize', handleResize);
}

async function loadAssetsAndFinalize() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    const collisionObjects = await initSchoolScene(scene, renderer);
    controls.setCollisionObjects(collisionObjects);
    // ✨ CAMBIO: Ajustamos la posición inicial del jugador aquí, después de cargar la escena.
    controls.getObject().position.set(-9.7, 1.7, 14.3);

    pointsOfInterest.forEach(pointData => {
        const point = new InterestPoint(pointData);
        interestPoints_scene.push(point);
        scene.add(point);
    });

    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

function handleExitGame(event) {
    if (event) event.preventDefault();

    const surveyURL = "https://forms.gle/NstdGJSNAj7wxLxn6";

    // ✨ CAMBIO: Lógica para abrir en nueva pestaña en móviles.
    if (isTouchDevice) {
        // Desbloqueamos los controles y abrimos el formulario en una nueva pestaña.
        controls.controls.unlock();
        window.open(surveyURL, '_blank');
    } else {
        // Para escritorio, mantenemos el comportamiento del overlay.
        const surveyOverlay = document.getElementById('survey-overlay');
        if (surveyOverlay) {
            controls.controls.unlock();
            surveyOverlay.classList.remove('hidden');
        }
    }
}

function checkInterestPoints() {
    if (!interactionRaycaster || !camera || interestPoints_scene.length === 0) return;
    interactionRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = interactionRaycaster.intersectObjects(interestPoints_scene);
    intersectedPoint = intersects.length > 0 ? intersects[0].object : null;
    const canInteract = !!intersectedPoint;
    if (canInteract) {
        interactionText.innerText = isTouchDevice ? "Toca el botón para interactuar" : "Presiona [E] para interactuar";
    }
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
    const coordsDisplay = document.getElementById('coords-display');
    if (coordsDisplay && controls) {
        const pos = controls.getObject().position;
        coordsDisplay.textContent = `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
    }
    renderer.render(scene, camera);
}

function handleResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
