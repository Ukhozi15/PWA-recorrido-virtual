import * as THREE from 'three';

// Aquí defines todos los puntos de interés que quieras en tu escena.
// Puedes añadir, quitar o modificar puntos fácilmente editando este array.
// ¡Asegúrate de que las coordenadas (new THREE.Vector3) estén dentro de tu escenario!
export const pointsOfInterest = [
  {
    position: new THREE.Vector3(-9.7, 3.2, 12.9), // Coordenadas X, Y, Z en el mundo 3D
    title: "BIENVENIDO AL COLEGIO FRANCÉS",
    description: "¡Bienvenido! 🌟 Aquí la curiosidad se convierte en aprendizaje y cada día es una nueva aventura. 🚀"
  },
  {
    position: new THREE.Vector3(9.6, 3.2, 3.7),
    title: "INFORMATE!",
    description: "En recepción siempre encontrarás una sonrisa y la información que necesites. 😊"
  },
  {
    position: new THREE.Vector3(-0.8, 3.2, 11.2),
    title: "SALÓN 1",
    description: "Un espacio donde las ideas vuelan y aprender es siempre emocionante. 📚"
  },
  {
    position: new THREE.Vector3(-9.3, 3.2, -2.4),
    title: "SALÓN 2",
    description: "Aquí la teoría cobra vida con actividades y proyectos dinámicos. 🎨"
  },
  {
    position: new THREE.Vector3(9.0, 3.2, 9.0),
    title: "TROFEOS",
    description: "Cada trofeo es una historia de esfuerzo, pasión y trabajo en equipo. 🏆"
  },
  {
    position: new THREE.Vector3(-4.3, 3.2, -5.8),
    title: "SILLÓN",
    description: "Tan cómodo que podrías olvidar que estabas esperando. 🛋️"
  }
];
