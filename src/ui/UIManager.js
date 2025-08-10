// src/ui/UIManager.js

let modalContainer, modalTitle, modalText, modalCloseButton;
let controls; // Referencia a los PointerLockControls

// Datos de prueba para los objetos interactivos (Sistema antiguo).
const interactionData = {
    "interactive_poster_historia": {
        title: "Historia de la Escuela",
        text: "Fundada en 1985, nuestra escuela ha sido un pilar en la comunidad, educando a generaciones de estudiantes con dedicación y excelencia."
    },
    // ... otros datos de prueba
};

/**
 * Inicializa el UIManager con una referencia a los controles del jugador.
 */
export function initUIManager(playerControls) {
    console.log("[UIManager] Inicializando...");
    modalContainer = document.getElementById('modal-container');
    modalTitle = document.getElementById('modal-title');
    modalText = document.getElementById('modal-text');
    modalCloseButton = document.getElementById('modal-close-button');
    controls = playerControls;

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', hideModal);
    } else {
        console.error("[UIManager] Error: No se encontró el botón para cerrar el modal.");
    }

    document.addEventListener('keydown', (event) => {
        if (modalContainer && !modalContainer.classList.contains('hidden') && event.code === 'Escape') {
            hideModal();
        }
    });
    console.log("[UIManager] Inicialización completa.");
}

/**
 * Muestra el modal con datos directos.
 * @param {object} data - Un objeto con { title, description }.
 */
export function showModalWithData(data) {
    console.log("--- INICIO DE INTERACCIÓN ---");
    console.log("[1] Función 'showModalWithData' fue llamada.");

    if (!data) {
        console.error("[Error] La función fue llamada sin datos (data is null).");
        return;
    }
    console.log("[2] Datos recibidos:", data);

    if (!modalContainer || !modalTitle || !modalText) {
        console.error("[Error] Uno o más elementos del modal no fueron encontrados en el HTML.");
        return;
    }
    console.log("[3] Elementos del Modal (container, title, text) encontrados correctamente.");

    if (!controls) {
        console.error("[Error] La referencia a los controles (controls) no está definida.");
        return;
    }
    console.log("[4] Referencia a los controles encontrada.");

    try {
        modalTitle.textContent = data.title;
        modalText.textContent = data.description;
        console.log(`[5] Título y texto del modal actualizados.`);
        
        console.log("[6] Intentando mostrar el modal (quitando la clase 'hidden')...");
        modalContainer.classList.remove('hidden');
        console.log("[7] Clase 'hidden' quitada. El modal debería estar visible ahora.");

        console.log("[8] Intentando desbloquear los controles del puntero...");
        controls.unlock();
        console.log("[9] Controles desbloqueados.");
        console.log("--- FIN DE INTERACCIÓN ---");
    } catch (error) {
        console.error("[Error Fatal] Ocurrió un error inesperado al intentar mostrar el modal:", error);
    }
}

/**
 * Oculta el modal.
 */
function hideModal() {
    if (!modalContainer) return;
    modalContainer.classList.add('hidden');
}

// Se mantiene la función antigua por si se necesita
export function showModal(objectName) {
    const data = interactionData[objectName];
    if (!data) return;
    showModalWithData({ title: data.title, description: data.text });
}
