// src/main.js

import * as THREE from 'three';
import './style.css';
import { FirstPersonControls } from './core/FirstPersonControls.js';
import { initSchoolScene } from './scenes/SchoolScene.js'; 
// --- MODIFICACIÓN: Importar los nuevos módulos que creamos ---
import { initUIManager, showModalWithData } from './ui/UIManager.js';
import { pointsOfInterest } from './data/pointsData.js';
import { InterestPoint } from './core/InterestPoint.js';

let scene, camera, renderer, controls, clock;

// --- MODIFICACIÓN: Añadir variables para el nuevo sistema de interacción ---
let interactionRaycaster;
const interestPoints_scene = []; // Array para guardar los objetos de la escena
let intersectedPoint = null;    // Para guardar el punto que estamos mirando
let interactionText;            // Referencia al elemento del DOM "Presiona [E]..."

/**
 * Contiene toda la lógica para configurar y empezar la experiencia 3D.
 */
async function startExperience() {
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

    const collisionObjects = await initSchoolScene(scene, renderer);

    controls = new FirstPersonControls(camera, canvas); 
    controls.setCollisionObjects(collisionObjects);
    scene.add(controls.getObject());

    initUIManager(controls.controls);

    // --- MODIFICACIÓN: Inicializar el Raycaster y los puntos de interés ---
    interactionRaycaster = new THREE.Raycaster();
    // Umbral de 3 unidades. El rayo no detectará objetos más lejanos. ¡Puedes ajustar este valor!
    interactionRaycaster.far = 3; 

    // Obtener la referencia al texto de interacción del HTML
    interactionText = document.getElementById('interaction-text');

    // Crear y añadir los puntos de interés a la escena
    pointsOfInterest.forEach(pointData => {
        const point = new InterestPoint(pointData);
        interestPoints_scene.push(point);
        scene.add(point);
    });
    
    // Añadir el listener para la tecla 'E' y para el botón de acción en móvil
    window.addEventListener('keydown', handleInteractionKey);
    document.getElementById('action-button').addEventListener('click', handleInteractionAction);

    // Inicia el bucle de animación
    animate();
}

/**
 * ✨ NUEVA FUNCIÓN ✨
 * Comprueba si estamos mirando un punto de interés.
 */
function checkInterestPoints() {
    // No hacer nada si los elementos necesarios no están listos
    if (!interactionRaycaster || !camera || interestPoints_scene.length === 0) return;

    // Lanza un rayo desde el centro de la cámara hacia adelante
    interactionRaycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = interactionRaycaster.intersectObjects(interestPoints_scene);

    if (intersects.length > 0) {
        // Hemos encontrado un punto de interés al alcance
        intersectedPoint = intersects[0].object;
        interactionText.classList.remove('hidden');
    } else {
        // No estamos mirando ningún punto
        if (intersectedPoint) { // Solo si había uno antes
            intersectedPoint = null;
            interactionText.classList.add('hidden');
        }
    }
}

/**
 * ✨ NUEVA FUNCIÓN ✨
 * Se llama cuando se presiona la tecla de interacción ('E').
 */
function handleInteractionKey(event) {
    if (event.code === 'KeyE') {
        handleInteractionAction();
    }
}

/**
 * ✨ NUEVA FUNCIÓN ✨
 * Lógica central de la interacción, llamada tanto por teclado como por botón móvil.
 */
function handleInteractionAction() {
    console.log("Intentando interactuar con:", intersectedPoint);
    if (intersectedPoint) {
        showModalWithData(intersectedPoint.pointData);
    }
}

/**
 * El bucle de renderizado que se ejecuta en cada fotograma.
 */
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (controls) {
        controls.update(delta);
        const pos = controls.getObject().position;
        document.getElementById('coords-display').textContent = 
            `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
    }

    // --- MODIFICACIÓN: Llamar a nuestra nueva función en cada fotograma ---
    checkInterestPoints();

    renderer.render(scene, camera);
}

/**
 * Maneja el redimensionamiento de la ventana.
 */
function handleResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.addEventListener('resize', handleResize);

/**
 * --- Punto de Entrada Principal ---
 * Decide si mostrar la pantalla de inicio (móvil) o empezar directamente (desktop).
 */
function main() {
    const isTouchDevice = 'ontouchstart' in window;

    if (isTouchDevice) {
        const startScreen = document.getElementById('start-screen');
        const mobileControls = document.getElementById('mobile-controls');

        startScreen.addEventListener('click', () => {
            startScreen.classList.add('hidden');
            mobileControls.classList.remove('hidden');

            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error al intentar activar pantalla completa: ${err.message}`);
            });

            screen.orientation.lock('landscape-primary').catch(err => {
                console.warn(`Error al intentar bloquear la orientación: ${err.message}`);
            });

            startExperience();

        }, { once: true });

    } else {
        startExperience();
    }
}

// Llama a la función principal para que todo comience.
main();
