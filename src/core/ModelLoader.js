// src/core/ModelLoader.js

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader(); // Crea una única instancia del cargador GLTF

/**
 * Carga un modelo 3D en formato GLB/GLTF.
 * @param {string} url - La ruta (URL) al archivo del modelo GLB/GLTF.
 * @returns {Promise<THREE.Group>} Una promesa que se resuelve con el objeto 3D cargado (THREE.Group o THREE.Scene).
 */
export function loadModel(url) {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            // Función que se ejecuta cuando el modelo se carga con éxito
            (gltf) => {
                console.log(`Modelo ${url} cargado con éxito.`, gltf.scene);
                // Los modelos GLTF pueden contener una escena (gltf.scene) o un conjunto de objetos (gltf.scenes, gltf.asset, etc.).
                // Para nuestros propósitos de nivel, gltf.scene es lo que generalmente queremos.
                resolve(gltf.scene);
            },
            // Función opcional para el progreso de carga
            (xhr) => {
                // Calcula y muestra el progreso en porcentaje
                console.log(`Progreso de carga de ${url}: ${Math.round(xhr.loaded / xhr.total * 100)}% cargado`);
            },
            // Función que se ejecuta si hay un error durante la carga
            (error) => {
                console.error(`Error al cargar el modelo ${url}:`, error);
                reject(error);
            }
        );
    });
}

/**
 * Carga múltiples modelos 3D.
 * @param {Array<string>} urls - Un array de rutas (URLs) a los archivos de los modelos GLB/GLTF.
 * @returns {Promise<Array<THREE.Group>>} Una promesa que se resuelve con un array de objetos 3D cargados.
 */
export async function loadMultipleModels(urls) {
    const promises = urls.map(url => loadModel(url));
    try {
        const models = await Promise.all(promises);
        console.log('Todos los modelos cargados con éxito.');
        return models;
    } catch (error) {
        console.error('Uno o más modelos fallaron al cargar:', error);
        throw error; // Propaga el error
    }
}