import * as THREE from 'three';

// Aquí defines todos los puntos de interés que quieras en tu escena.
// Puedes añadir, quitar o modificar puntos fácilmente editando este array.
// ¡Asegúrate de que las coordenadas (new THREE.Vector3) estén dentro de tu escenario!
export const pointsOfInterest = [
  {
    position: new THREE.Vector3(1.9, 1.7, -0.2), // Coordenadas X, Y, Z en el mundo 3D
    title: "Mural de Bienvenida",
    description: "Este mural fue pintado por la clase de 2021 y representa los valores de nuestra institución: creatividad, comunidad y conocimiento."
  },
  {
    position: new THREE.Vector3(-8, 1.7, -15),
    title: "Cafetería Estudiantil",
    description: "El punto de encuentro principal para estudiantes. Ofrece una variedad de alimentos y bebidas durante todo el día."
  },
  {
    position: new THREE.Vector3(15, 1.7, 0),
    title: "Canchas Deportivas",
    description: "Nuestras instalaciones deportivas incluyen canchas de baloncesto y fútbol, disponibles para todos los estudiantes."
  }
];
