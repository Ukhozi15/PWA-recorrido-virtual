// src/ui/UIManager.js

// 1. Importamos la función para registrar la interacción
import { registerInteraction } from '../core/api.js';

let pointerLockControls;

const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalCloseButton = document.getElementById('modal-close-button');

export function initUIManager(controls) {
    pointerLockControls = controls;
    modalCloseButton.addEventListener('click', hideModal);
}

export function showModalWithData(pointData) {
    if (!pointData || !modalContainer) {
        console.warn(`showModalWithData: No se recibieron datos o la UI no está inicializada.`);
        return;
    }

    modalTitle.textContent = pointData.title;
    modalText.textContent = pointData.description;
    modalContainer.classList.remove('hidden');
    
    // Desbloquea el cursor para que el usuario pueda interactuar con el modal
    if (pointerLockControls && pointerLockControls.isLocked) {
        pointerLockControls.unlock();
    }

    // ✨ ¡ESTA ES LA PARTE QUE FALTABA! ✨
    // Registra la interacción cuando se muestra el modal
    if (pointerLockControls) {
        const playerPosition = pointerLockControls.getObject().position;
        // Llama a la función que se comunica con el backend
        registerInteraction(pointData.id, playerPosition);
    }
}

function hideModal() {
    if (!modalContainer) return;
    modalContainer.classList.add('hidden');
}
