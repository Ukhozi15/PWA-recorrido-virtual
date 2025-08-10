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
    const modelPath = "/models/cafeteria.glb"; // Ruta del modelo GLB

    try {
        console.log(`Intentando cargar el modelo desde: ${modelPath}`);
        const gltf = await loader.loadAsync(modelPath);

        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // --- NOTA IMPORTANTE PARA EL MODELADOR ---
                // Para que un objeto sea interactivo, su nombre en Blender debe
                // empezar con "interactive_". Por ejemplo: "interactive_puerta"
                // o "interactive_poster_ciencias".
                // El sistema de FirstPersonControls buscará este prefijo.
                
                collisionObjects.push(child);
            }
        });

        scene.add(gltf.scene);
        console.log("Modelo cargado para visualización y colisión.");

    } catch (error) {
        console.error("--- ¡ERROR AL CARGAR EL MODELO! ---", error);
    }
}
