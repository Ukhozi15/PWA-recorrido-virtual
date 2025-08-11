// src/ui/UIManager.js

let modalContainer, modalTitle, modalText, modalCloseButton;
let pointerLockControls; // Renombrado para mayor claridad

// Ahora recibe los PointerLockControls directamente
export function initUIManager(controls) { 
    modalContainer = document.getElementById('modal-container');
    modalTitle = document.getElementById('modal-title');
    modalText = document.getElementById('modal-text');
    modalCloseButton = document.getElementById('modal-close-button');

    pointerLockControls = controls; // Se guarda la referencia correcta

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', hideModal);
    } else {
        console.error("UIManager: No se encontró el botón para cerrar el modal.");
    }

    document.addEventListener('keydown', (event) => {
        if (modalContainer && !modalContainer.classList.contains('hidden') && event.code === 'Escape') {
            hideModal();
        }
    });
}

export function showModalWithData(data) {
    if (!data || !modalContainer) {
        console.warn(`showModalWithData: No se recibieron datos o la UI no está inicializada.`);
        return;
    }

    modalTitle.textContent = data.title;
    modalText.textContent = data.description;
    modalContainer.classList.remove('hidden');
    
    // Se usa la referencia correcta para desbloquear los controles del ratón
    if (pointerLockControls && pointerLockControls.isLocked) {
        pointerLockControls.unlock();
    }
}

function hideModal() {
    if (!modalContainer) return;
    modalContainer.classList.add('hidden');
}
