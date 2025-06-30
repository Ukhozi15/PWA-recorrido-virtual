import * as THREE from 'three';
import './style.css';
// Importa las funciones de nuestro nuevo módulo de controles
import { initFirstPersonControls, updateFirstPersonControls, getFirstPersonControls } from './core/FirstPersonControls.js';
import { loadModel } from './core/ModelLoader.js'; 
import { initSchoolScene, updateSchoolScene } from './scenes/SchoolScene.js'; 

// 1. Configurar la Escena
const scene = new THREE.Scene();

// 2. Configurar la Cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Asegúrate de que la altura (Y) sea positiva y que la posición no esté dentro de tus modelos de prueba
camera.position.set(0, 1.7, 5); // Por ejemplo, 1.7 metros de altura, 5 metros hacia adelante desde el origen

// 3. Configurar el Renderizador
const canvas = document.getElementById('webglCanvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// 4. instaciar el modelo de prueba

initSchoolScene(scene);



// ********* Inicializar los controles de primera persona *********
initFirstPersonControls(camera, canvas, scene);
const controls = getFirstPersonControls(); // Opcional, si necesitas acceso directo a los controles en main.js

// ********* Preparar para el delta time *********
const clock = new THREE.Clock(); // Un reloj para calcular el tiempo entre frames

// 6. Función de Animación (Render Loop)
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Obtiene el tiempo transcurrido desde la última llamada

    // ********* Actualizar los controles en cada frame *********
    updateFirstPersonControls(delta);

    renderer.render(scene, camera);
}

// 7. Manejar el Redimensionamiento de la Ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
});

// Inicia la animación
animate();