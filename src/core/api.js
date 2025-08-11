// src/core/api.js

// La URL base de tu backend.
// Durante el desarrollo, apunta a tu servidor local.
// Cuando despliegues, cambiarás esto a la URL de tu servidor en producción.
//const API_BASE_URL = 'http://localhost:3001'; 
 const API_BASE_URL = 'https://pwa-backend-n2bj.onrender.com'; // Ejemplo para producción

/**
 * Registra una interacción del usuario en el backend.
 * @param {string} objectId - El ID del objeto con el que se interactuó.
 * @param {THREE.Vector3} position - La posición del jugador en el momento de la interacción.
 */
export async function registerInteraction(objectId, position) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectId: objectId,
        // Convertimos el Vector3 a un array simple para enviarlo como JSON
        position: [position.x, position.y, position.z],
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Interacción registrada con éxito:', result.message);
    return result;

  } catch (error) {
    console.error('No se pudo registrar la interacción:', error);
  }
}
