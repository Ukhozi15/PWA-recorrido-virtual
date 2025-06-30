// src/core/FirstPersonControls.js

import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import * as THREE from 'three';

let controls;
let camera;
let scene;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false; // Opcional: para saltar o volar
let moveDown = false; // Opcional: para agacharse o bajar



const speed = 5.0; // Velocidad de movimiento en unidades por segundo (ej. 5 metros/segundo)

const walkingSpeed = 5.0; // Velocidad máxima de "caminar"
const acceleration = 50.0; // Aceleración en unidades/segundo^2
const deceleration = 10.0; // Deceleración en unidades/segundo^2

// Vectores para las velocidades actuales en los ejes X, Y, Z locales de la cámara
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3(); // Vector que representa la dirección deseada (normalized)

const gravity = 9.8; // Fuerza de la gravedad (metros/segundo^2)
let isGrounded = false; // Indica si el jugador está tocando el suelo

// Variables para el Head Bob
const headBobFrequency = 8; // Frecuencia del balanceo (más alto = más rápido)
const headBobAmplitude = 0.05; // Amplitud del balanceo (más alto = más pronunciado)
let headBobTimer = 0; // Temporizador para controlar la fase del head bob
const cameraBaseY = 1.7; // Altura base de la cámara (altura de los ojos)

const defaultFov = 75; // FOV por defecto
const minFov = 30;     // FOV mínimo (más zoom-in)
const maxFov = 100;    // FOV máximo (más zoom-out)
const fovStep = 5;     // Cantidad de cambio de FOV por cada scroll

/**
 * Inicializa los controles de primera persona.
 * @param {THREE.Camera} _camera - La cámara a controlar.
 * @param {HTMLElement} domElement - El elemento DOM al que se adjuntarán los controles (normalmente el canvas).
 * @param {THREE.Scene} _scene - La escena actual (necesaria para añadir la cámara a los controles).
 */
export function initFirstPersonControls(_camera, domElement, _scene) {
  camera = _camera;
  scene = _scene;

  // Instancia los PointerLockControls
  controls = new PointerLockControls(camera, domElement);

  // Agrega la cámara (que ahora está dentro de los controles) a la escena
  scene.add(controls.object); // Ahora se usa .object directamente
  // Añade un evento para activar los controles al hacer clic en el canvas
  domElement.addEventListener(
    "click",
    () => {
      controls.lock(); // Bloquea el puntero y activa los controles
    },
    false
  );

  // Wheel Zoom
  domElement.addEventListener('wheel', (event) => {
    // Solo aplica el zoom si los controles están bloqueados
    if (controls.isLocked) {
        event.preventDefault(); // Evita el scroll de la página
        let newFov = camera.fov;

        if (event.deltaY < 0) {
            // Scroll hacia arriba (zoom-in, FOV más pequeño)
            newFov = Math.max(minFov, camera.fov - fovStep);
        } else {
            // Scroll hacia abajo (zoom-out, FOV más grande)
            newFov = Math.min(maxFov, camera.fov + fovStep);
        }

        // Si el FOV ha cambiado, actualiza la cámara
        if (newFov !== camera.fov) {
            camera.fov = newFov;
            camera.updateProjectionMatrix(); // Importante: recalcula la proyección después de cambiar el FOV
            console.log(`FOV actual: ${camera.fov}`);
        }
    }
}, { passive: false }); // Usar { passive: false } es importante para que preventDefault funcione
// ****************************************************

  // Opcional: Escuchar eventos de bloqueo/desbloqueo
  controls.addEventListener("lock", () => {
    console.log("PointerLockControls Bloqueados");
    // Aquí podrías mostrar un mensaje "Haz clic para salir" o pausar el juego
  });

  controls.addEventListener("unlock", () => {
    console.log("PointerLockControls Desbloqueados");
    // Aquí podrías mostrar el cursor y pausar el juego
  });

  

  // Retorna los controles para que puedan ser usados desde fuera si es necesario
  return controls;
}

/**
 * Actualiza los controles en cada frame de animación.
 * Por ahora, PointerLockControls maneja su propia actualización de rotación con los eventos del ratón.
 * Más adelante añadiremos la lógica de movimiento aquí.
 * @param {number} delta - El tiempo transcurrido desde el último frame (para movimiento independiente del FPS).
 */
export function updateFirstPersonControls(delta) {
    if (controls && controls.isLocked) {
        // --- 1. Aplicar Desaceleración ---
        velocity.x -= velocity.x * deceleration * delta;
        velocity.z -= velocity.z * deceleration * delta;

        // --- 2. Aplicar Gravedad ---
        // Solo aplica gravedad si no estamos pidiendo volar hacia arriba y no estamos ya en el suelo
        if (!moveUp && !isGrounded) {
            velocity.y -= gravity * delta; // Aplicar fuerza hacia abajo
        }

        // --- 3. Establecer Dirección Deseada y Aceleración ---
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // Normaliza para evitar movimiento diagonal más rápido

        // Aceleración
        if (moveForward || moveBackward) {
            // Ajuste crucial aquí: el movimiento hacia adelante en THREE.JS translateZ es negativo
            // Si direction.z es 1 (adelante), queremos que velocity.z se vuelva más negativo.
            // Si direction.z es -1 (atrás), queremos que velocity.z se vuelva más positivo.
            velocity.z -= direction.z * acceleration * delta;
        } else {
            // Desaceleración en Z si no hay input frontal/trasero
            velocity.z -= velocity.z * deceleration * delta;
        }

        if (moveLeft || moveRight) {
            // Ajuste crucial aquí: el movimiento hacia la izquierda en THREE.JS translateX es negativo
            // Si direction.x es 1 (derecha), queremos que velocity.x se vuelva más positivo.
            // Si direction.x es -1 (izquierda), queremos que velocity.x se vuelva más negativo.
            velocity.x -= direction.x * acceleration * delta; // <--- Este es el que necesitamos invertir
        } else {
            // Desaceleración en X si no hay input lateral
            velocity.x -= velocity.x * deceleration * delta;
        }
        // Movimiento vertical (para "volar" o "saltar")
        if (moveUp && isGrounded) { // Solo si estamos en el suelo, para saltar
            velocity.y = 8; // Una fuerza de "salto" inicial
            isGrounded = false; // Ya no estamos en el suelo
        } else if (moveDown) {
            velocity.y = -walkingSpeed; // Agacharse o bajar rápido
        }


        // --- 4. Limitar la Velocidad ---
        velocity.x = Math.max(-walkingSpeed, Math.min(walkingSpeed, velocity.x));
        velocity.z = Math.max(-walkingSpeed, Math.min(walkingSpeed, velocity.z));
        // Para velocity.y, lo manejamos más con la gravedad y el salto.
        // Podrías poner un límite máximo de caída si quisieras.


        // --- 5. Mover la Cámara (Aplicar Velocidad) ---
        // Mueve la cámara en su eje local 'x' (izquierda/derecha)
        controls.object.translateX(velocity.x * delta);
        // Mueve la cámara en su eje local 'z' (adelante/atrás)
        controls.object.translateZ(velocity.z * delta);
        // Mueve la cámara en su eje Y (arriba/abajo, relativo al mundo)
        controls.object.position.y += velocity.y * delta;

        // --- 6. Simular Suelo / Colisión Básica con el Suelo ---
        // Si la cámara está por debajo de la altura base y se mueve hacia abajo
        if (controls.object.position.y < cameraBaseY) {
            controls.object.position.y = cameraBaseY; // La devuelve a la altura del suelo
            velocity.y = 0; // Detiene el movimiento vertical
            isGrounded = true; // El jugador está en el suelo
        } else {
            isGrounded = false;
        }

        // --- 7. Aplicar Head Bob (solo si el jugador se está moviendo horizontalmente) ---
        // Comprueba si hay movimiento horizontal significativo
        if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1) {
            headBobTimer += delta * headBobFrequency; // Incrementa el temporizador
            // Calcula el desplazamiento vertical usando una función seno
            camera.position.y = cameraBaseY + Math.sin(headBobTimer) * headBobAmplitude;
            // Opcional: un pequeño balanceo lateral si quieres
            // camera.position.x = controls.object.position.x + Math.sin(headBobTimer / 2) * headBobAmplitude * 0.5;
        } else {
            // Si no hay movimiento, la cámara vuelve suavemente a su posición base
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraBaseY, 0.1); // Lerp para suavizar
            headBobTimer = 0; // Reinicia el temporizador
        }

    } else {
        // Si los controles no están bloqueados, restablecer la velocidad y posición para evitar movimientos bruscos al retomar
        velocity.set(0, 0, 0);
        camera.position.y = cameraBaseY; // Asegura que la cámara esté en su posición base al desbloquear
        headBobTimer = 0;
    }
}

// *** Event Listeners para Teclado ***

// Escucha el evento 'keydown' (cuando una tecla es presionada)
document.addEventListener("keydown", (event) => {
  // Usa un switch para manejar diferentes teclas de movimiento
  switch (event.code) {
    // Mover hacia adelante (tecla W)
    case "KeyW":
      moveForward = true;
      break;
    // Mover hacia la izquierda (tecla A)
    case "KeyA":
      moveLeft = true;
      break;
    // Mover hacia atrás (tecla S)
    case "KeyS":
      moveBackward = true;
      break;
    // Mover hacia la derecha (tecla D)
    case "KeyD":
      moveRight = true;
      break;
    // Mover hacia arriba (Espacio - opcional para saltar o "volar")
    case "Space":
      moveUp = true;
      break;
    // Mover hacia abajo (Shift Izquierdo o Ctrl Izquierdo - opcional para agacharse o "bajar")
    case "ShiftLeft":
    case "ControlLeft":
      moveDown = true;
      break;
  }
});

// Escucha el evento 'keyup' (cuando una tecla es liberada)
document.addEventListener("keyup", (event) => {
  // Usa un switch para restablecer el estado de las variables de movimiento
  switch (event.code) {
    // Detener movimiento hacia adelante (tecla W)
    case "KeyW":
      moveForward = false;
      break;
    // Detener movimiento hacia la izquierda (tecla A)
    case "KeyA":
      moveLeft = false;
      break;
    // Detener movimiento hacia atrás (tecla S)
    case "KeyS":
      moveBackward = false;
      break;
    // Detener movimiento hacia la derecha (tecla D)
    case "KeyD":
      moveRight = false;
      break;
    // Detener movimiento hacia arriba (Espacio)
    case "Space":
      moveUp = false;
      break;
    // Detener movimiento hacia abajo (Shift Izquierdo o Ctrl Izquierdo)
    case "ShiftLeft":
    case "ControlLeft":
      moveDown = false;
      break;
  }
});

/**
 * Devuelve la instancia de los controles.
 * @returns {PointerLockControls}
 */
export function getFirstPersonControls() {
  // <--- Asegúrate que diga 'export function'
  return controls;
}
