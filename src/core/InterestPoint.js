import * as THREE from 'three';

// Usamos Sprites para que el icono siempre mire a la cámara.
export class InterestPoint extends THREE.Sprite {
    constructor(pointData) {
        // --- 1. Crear el Material ---
        // Cargamos la textura del icono. Asegúrate de tener 'info-icon.png' en tu carpeta /public.
        const map = new THREE.TextureLoader().load('/info.png');
        const material = new THREE.SpriteMaterial({
            map: map,
            alphaTest: 0.5, // Evita que se vean los bordes transparentes del PNG
            transparent: true,
            depthTest: false, // El icono no será tapado por otros objetos transparentes
            depthWrite: false, // Importante para la correcta renderización de la transparencia
        });

        // --- 2. Llamar al constructor de THREE.Sprite ---
        super(material);

        // --- 3. Asignar Datos y Posición ---
        // Guardamos los datos del punto directamente en el objeto para un fácil acceso.
        this.pointData = {
            title: pointData.title,
            description: pointData.description
        };

        this.position.copy(pointData.position);

        // Ajustamos la escala para que no sea ni muy grande ni muy pequeño.
        this.scale.set(0.3, 0.3, 0.3); 

        // Le damos un nombre para poder identificarlo fácilmente si lo necesitamos.
        this.name = "InterestPoint";
    }
}
