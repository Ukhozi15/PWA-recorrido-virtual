// src/scenes/SchoolScene.js

import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

let scene;
const collisionObjects = []; 

export async function initSchoolScene(threeScene, renderer) {
    scene = threeScene;
    setupLightingAndEnvironment(renderer);
    await loadSceneModels();
    
    if (collisionObjects.length === 0) {
        console.error("¡ALERTA! No se cargó ningún objeto de colisión.");
    }

    console.log("Escena inicializada. Objetos de colisión listos:", collisionObjects.length);
    return collisionObjects;
}

function setupLightingAndEnvironment(renderer) {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 15, 8);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const hdrPath = '/textures/sky.hdr'; 
    new RGBELoader()
        .load(hdrPath, (texture) => {
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;
            scene.background = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        }, undefined, (error) => {
            console.error(`Error al cargar el HDRi ${hdrPath}:`, error);
        });
}

async function loadSceneModels() {
    const loader = new GLTFLoader();
    const modelPath = "/models/school_mvp.glb"; // Ruta del modelo GLB

    try {
        console.log(`Intentando cargar el modelo desde: ${modelPath}`);
        const gltf = await loader.loadAsync(modelPath);

        const model = gltf.scene;

        // --- ✨ AQUÍ PUEDES AJUSTAR TU MODELO ✨ ---

        // 1. AJUSTAR LA ESCALA
        // El valor (x, y, z) multiplica el tamaño original.
        // Prueba con diferentes números hasta que se vea bien.
        model.scale.set(100, 105, 100); // Ejemplo: hacerlo 15 veces más grande

        // 2. AJUSTAR LA POSICIÓN
        // Cambia las coordenadas (x, y, z) para mover el modelo.
        // El objetivo es que el punto de inicio del jugador quede donde tú quieras.
        model.position.set(0, 1.6, 5.0); // Ejemplo: bajarlo 2 unidades en el eje Y

        // 3. AJUSTAR LA ROTACIÓN (Opcional)
        // Si el modelo mira en la dirección incorrecta.
        // El valor es en radianes (Math.PI es media vuelta).
        // model.rotation.y = Math.PI; // Ejemplo: girarlo 180 grados

        // -------------------------------------------

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Para que un objeto sea interactivo, su nombre en Blender debe
                // empezar con "interactive_".
                
                collisionObjects.push(child);
            }
        });

        scene.add(model);
        console.log("Modelo cargado para visualización y colisión.");

    } catch (error) {
        console.error("--- ¡ERROR AL CARGAR EL MODELO! ---", error);
    }
}
