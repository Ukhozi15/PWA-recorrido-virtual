// src/scenes/SchoolScene.js

import * as THREE from "three";
import { loadModel } from "../core/ModelLoader.js"; // Importa el cargador de modelos

let scene; // La instancia de la escena de Three.js

/**
 * Inicializa la escena de la escuela con luces y un entorno básico.
 * @param {THREE.Scene} threeScene - La instancia de la escena global de Three.js.
 */
export function initSchoolScene(threeScene) {
  scene = threeScene; // Asigna la escena global a la variable local

  // ** 1. Configuración de Iluminación **
  // Quita estas luces de main.js y ponlas aquí para centralizar la configuración de la escena.
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Luz ambiental general
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Luz direccional (simula el sol)
  directionalLight.position.set(5, 15, 8); // Posiciona la luz
  directionalLight.castShadow = true; // Habilita sombras proyectadas por esta luz

  // Opcional: Configura los parámetros de sombra para un mejor rendimiento/calidad
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  // ** 2. Añadir un Suelo Básico (temporal hasta que el modelador entregue el suelo) **
  // Esto ayudará a tener una referencia espacial.
  const floorGeometry = new THREE.PlaneGeometry(100, 100); // Un plano grande
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // Rota para que sea horizontal
  floor.receiveShadow = true; // Permite que el suelo reciba sombras
  scene.add(floor);

  // ** 3. Preparación para cargar modelos específicos (vacío por ahora) **
  // Esta función se llamará cuando tengamos los modelos finales del modelador.
  loadSpecificModels();
}

/**
 * Carga los modelos 3D específicos del aula y pasillo.
 * Esta función se llamará dentro de initSchoolScene o cuando los modelos estén listos.
 */
async function loadSpecificModels() {
  const aulaPath = "../public/models/damagedhelmet.glb"; // <--- Usar el nombre EXACTO
  const pasilloPath = "../public/models/duck.glb"; // <--- Usar el nombre EXACTO

  try {
    const aulaModel = await loadModel(aulaPath);
    aulaModel.position.set(0, 0.5, -5);
    aulaModel.scale.set(1, 1, 1);
    scene.add(aulaModel);
    console.log("Modelo de Aula de prueba cargado y añadido a la escena.");

    const pasilloModel = await loadModel(pasilloPath);
    pasilloModel.position.set(5, 0.5, 0);
    pasilloModel.scale.set(0.5, 0.5, 0.5);
    scene.add(pasilloModel);
    console.log("Modelo de Pasillo de prueba cargado y añadido a la escena.");
  } catch (error) {
    console.error("Error al cargar modelos específicos de la escuela:", error);
  }
}

/**
 * Opcional: Función para actualizar elementos de la escena (si fueran dinámicos).
 * Por ahora, no necesitamos actualización constante para la escena estática.
 */
export function updateSchoolScene(delta) {
  // Lógica de actualización para la escena, si la hubiera (ej. animaciones de puertas, objetos)
}
