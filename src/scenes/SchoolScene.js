// src/scenes/SchoolScene.js

import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

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

// ✨ CAMBIO: Lógica de carga de modelos actualizada con un sistema de fallback.
async function loadSceneModels() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/'); // Asegúrate de que esta carpeta está en /public/draco/
    
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const dracoModelPath = "/models/school_mvp_draco.glb";
    const fallbackModelPath = "/models/school_mvp.glb"; // Tu modelo original

    try {
        // 1. Intenta cargar el modelo optimizado con DRACO
        console.log(`Intentando cargar el modelo DRACO desde: ${dracoModelPath}`);
        const gltf = await gltfLoader.loadAsync(dracoModelPath);
        console.log("¡Modelo DRACO cargado con éxito!");
        processLoadedModel(gltf.scene);
    } catch (error) {
        // 2. Si falla, intenta cargar el modelo original
        console.warn(`No se pudo cargar el modelo DRACO. Razón: ${error.message}. Intentando cargar el modelo original...`);
        
        try {
            const fallbackLoader = new GLTFLoader(); // Usamos un cargador limpio sin DRACO
            const gltf = await fallbackLoader.loadAsync(fallbackModelPath);
            console.log("¡Modelo original (fallback) cargado con éxito!");
            processLoadedModel(gltf.scene);
        } catch (fallbackError) {
            // 3. Si ambos fallan, muestra un error definitivo
            console.error("--- ¡ERROR CRÍTICO! No se pudo cargar ningún modelo. ---", fallbackError);
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.innerHTML = `<div class="loading-text" style="color:red; padding: 20px;">Error fatal al cargar los recursos 3D. Por favor, revisa la consola y recarga la página.</div>`;
            }
        }
    }
}

// ✨ NUEVA FUNCIÓN: Procesa el modelo una vez que se ha cargado (para no repetir código)
function processLoadedModel(model) {
    model.scale.set(100, 105, 100); 
    model.position.set(0, 1.6, 5.0);

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            collisionObjects.push(child);
        }
    });

    scene.add(model);
    console.log("Modelo procesado y añadido a la escena.");
}
