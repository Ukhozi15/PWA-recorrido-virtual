// src/core/FirstPersonControls.js

import * as THREE from 'three';
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { showModal } from '../ui/UIManager.js';

export class FirstPersonControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.controls = new PointerLockControls(camera, domElement);

        this.playerHeight = 1.7;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.gravity = 30.0;
        this.acceleration = 50.0;
        this.deceleration = 10.0;
        this.walkingSpeed = 5.0;

        this.collisionObjects = [];
        this.maxStepHeight = 0.4;
        this.downRaycaster = new THREE.Raycaster();
        this.horizontalRaycaster = new THREE.Raycaster();
        
        // --- ✨ NUEVO: Raycaster para detectar obstáculos a nivel del cuerpo ---
        // Este raycaster evitará que el jugador suba a objetos como mesas y sillas.
        this.bodyRaycaster = new THREE.Raycaster();

        this.interactionRaycaster = new THREE.Raycaster();
        this.interactiveObject = null;
        this.interactionDistance = 3;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isGrounded = false;

        this.headBobFrequency = 8;
        this.headBobAmplitude = 0.05;
        this.headBobTimer = 0;
        this.headBobOffset = 0;
        
        this.isTouchDevice = 'ontouchstart' in window;
        this.joystick = {
            active: false,
            touchId: null,
            container: document.getElementById('joystick-container'),
            thumb: document.getElementById('joystick-thumb'),
            center: new THREE.Vector2(),
            current: new THREE.Vector2()
        };
        this.look = {
            active: false,
            touchId: null,
            start: new THREE.Vector2(),
            current: new THREE.Vector2()
        };
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;

        this._setupEventListeners();
    }

    setCollisionObjects(objects) {
        this.collisionObjects = objects;
        if (this.collisionObjects.length > 0) {
            this._snapToGround();
        }
    }

    getObject() {
        return this.controls.object;
    }
    
    get isLocked() {
        return this.controls.isLocked || this.isTouchDevice;
    }

    update(delta) {
        if (!this.isLocked) return;

        if (this.joystick.active) {
            const joystickDelta = this.joystick.current.clone().sub(this.joystick.center);
            const moveSpeed = joystickDelta.length() / (this.joystick.container.clientWidth / 2);
            if (moveSpeed > 0.1) {
                const angle = Math.atan2(joystickDelta.y, joystickDelta.x);
                this.direction.z = -Math.sin(angle) * moveSpeed;
                this.direction.x = -Math.cos(angle) * moveSpeed;
            } else { this.direction.set(0,0,0); }
        } else {
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        }
        this.direction.normalize();

        this.controls.object.position.y -= this.headBobOffset;
        this._updateGravity(delta);

        this.velocity.x -= this.velocity.x * this.deceleration * delta;
        this.velocity.z -= this.velocity.z * this.deceleration * delta;

        if (this.direction.lengthSq() > 0) {
             this.velocity.z -= this.direction.z * this.acceleration * delta;
             this.velocity.x -= this.direction.x * this.acceleration * delta;
        }
        
        this._handleHorizontalCollisions();

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        this.controls.object.position.y += this.velocity.y * delta;
        
        this._updateHeadBob(delta);
        this.controls.object.position.y += this.headBobOffset;

        this._checkForInteraction();
    }

    _snapToGround() {
        const playerPosition = this.controls.object.position;
        const snapRaycaster = new THREE.Raycaster(new THREE.Vector3(playerPosition.x, 100, playerPosition.z), new THREE.Vector3(0, -1, 0));
        const intersections = snapRaycaster.intersectObjects(this.collisionObjects, true);
        if (intersections.length > 0) {
            playerPosition.y = intersections[0].point.y + this.playerHeight;
        }
    }
    
    _checkForInteraction() {
        if (!this.isLocked) return;
        this.interactionRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.interactionRaycaster.intersectObjects(this.collisionObjects, true);
        const interactionText = document.getElementById('interaction-text');
        this.interactiveObject = null;

        for (const intersect of intersects) {
            if (intersect.distance < this.interactionDistance) {
                const object = intersect.object;
                if (object.name.startsWith("interactive_")) {
                    this.interactiveObject = object;
                    break;
                }
            }
        }

        if (interactionText) {
            interactionText.classList.toggle('hidden', !this.interactiveObject);
        }
    }

    _handleInteraction() {
        if (this.interactiveObject) {
            showModal(this.interactiveObject.name);

            const eventData = {
                objectId: this.interactiveObject.name,
                position: this.controls.object.position.toArray()
            };

            const backendUrl = 'http://localhost:3001/api/interaction';

            fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status}`);
                }
                return response.json();
            })
            .then(data => console.log('Backend: Interacción registrada con éxito.', data))
            .catch(error => console.error('Error al enviar la interacción al backend:', error));
        }
    }
    
    _updateGravity(delta) {
        this.isGrounded = false;
        const playerPosition = this.controls.object.position;
        this.downRaycaster.set(playerPosition, new THREE.Vector3(0, -1, 0));
        const intersections = this.downRaycaster.intersectObjects(this.collisionObjects, true);
        if (intersections.length > 0 && intersections[0].distance <= this.playerHeight) {
            playerPosition.y = intersections[0].point.y + this.playerHeight;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * delta;
        }
    }

    // --- ✨ MÉTODO MODIFICADO ✨ ---
    _handleHorizontalCollisions() {
        const horizontalDirection = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
        if (horizontalDirection.lengthSq() === 0) return;

        const playerPosition = this.controls.object.position;
        const collisionThreshold = 0.5;

        // --- Verificación de obstáculos a nivel del cuerpo ---
        // Se lanza un rayo desde la mitad de la altura del jugador para detectar paredes u objetos no escalables.
        const bodyPosition = new THREE.Vector3(playerPosition.x, playerPosition.y - this.playerHeight / 2, playerPosition.z);
        this.bodyRaycaster.set(bodyPosition, horizontalDirection);
        const bodyIntersections = this.bodyRaycaster.intersectObjects(this.collisionObjects, true);

        if (bodyIntersections.length > 0 && bodyIntersections[0].distance < collisionThreshold) {
            // Si el rayo del cuerpo choca con algo muy cerca, es un obstáculo infranqueable.
            // Se detiene el movimiento por completo y se sale de la función para evitar la lógica de "subir escalón".
            this.velocity.x = 0;
            this.velocity.z = 0;
            return; 
        }

        // --- Lógica original para subir escalones (solo se ejecuta si no hay un obstáculo a nivel del cuerpo) ---
        this.horizontalRaycaster.set(playerPosition, horizontalDirection);
        const intersections = this.horizontalRaycaster.intersectObjects(this.collisionObjects, true);

        if (intersections.length > 0 && intersections[0].distance < collisionThreshold) {
            const contactPoint = intersections[0].point;
            const groundHeightAtContact = this._getGroundHeight(contactPoint);
            const currentGroundHeight = playerPosition.y - this.playerHeight;
            const heightDifference = groundHeightAtContact - currentGroundHeight;

            if (heightDifference > 0 && heightDifference < this.maxStepHeight) {
                // Sube el escalón
                playerPosition.y += heightDifference;
            } else {
                // Es una pared o un obstáculo demasiado alto, detente
                this.velocity.x = 0;
                this.velocity.z = 0;
            }
        }
    }
    
    _getGroundHeight(position) {
        const checkRaycaster = new THREE.Raycaster(new THREE.Vector3(position.x, this.camera.position.y + this.maxStepHeight, position.z), new THREE.Vector3(0, -1, 0));
        const intersections = checkRaycaster.intersectObjects(this.collisionObjects, true);
        return intersections.length > 0 ? intersections[0].point.y : -Infinity;
    }
    
    _updateHeadBob(delta) {
        if (this.isGrounded && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1)) {
            this.headBobTimer += delta * this.headBobFrequency;
            this.headBobOffset = Math.sin(this.headBobTimer) * this.headBobAmplitude;
        } else {
            this.headBobTimer = 0;
            this.headBobOffset = 0;
        }
    }

    _setupEventListeners() {
        if (this.isTouchDevice) {
            this.domElement.addEventListener('touchstart', this._onTouchStart.bind(this));
            this.domElement.addEventListener('touchmove', this._onTouchMove.bind(this));
            this.domElement.addEventListener('touchend', this._onTouchEnd.bind(this));
            
            const actionButton = document.getElementById('action-button');
            if(actionButton) {
                actionButton.addEventListener('click', () => this._handleInteraction());
            }
        } else {
            this.domElement.addEventListener('click', () => this.controls.lock());
            document.addEventListener('keydown', this._onKeyDown.bind(this));
            document.addEventListener('keyup', this._onKeyUp.bind(this));
        }
    }

    _onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'KeyE': this._handleInteraction(); break;
        }
    }

    _onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyD': this.moveRight = false; break;
        }
    }

    _onTouchStart(event) {
        for (const touch of event.changedTouches) {
            const x = touch.clientX;
            const y = touch.clientY;
            const rect = this.joystick.container.getBoundingClientRect();
            const distSq = (x - (rect.left + rect.width / 2)) ** 2 + (y - (rect.top + rect.height / 2)) ** 2;
            if (distSq < (rect.width / 2) ** 2 && !this.joystick.active) {
                this.joystick.active = true;
                this.joystick.touchId = touch.identifier;
                this.joystick.center.set(rect.left + rect.width / 2, rect.top + rect.height / 2);
                this.joystick.current.set(x, y);
            } else if (!this.look.active) {
                this.look.active = true;
                this.look.touchId = touch.identifier;
                this.look.start.set(x, y);
                this.look.current.set(x, y);
            }
        }
    }

    _onTouchMove(event) {
        event.preventDefault();
        for (const touch of event.changedTouches) {
            const x = touch.clientX;
            const y = touch.clientY;
            if (touch.identifier === this.joystick.touchId) {
                this.joystick.current.set(x, y);
                const delta = this.joystick.current.clone().sub(this.joystick.center);
                if (delta.length() > this.joystick.container.clientWidth / 2) {
                    delta.normalize().multiplyScalar(this.joystick.container.clientWidth / 2);
                }
                this.joystick.thumb.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
            } else if (touch.identifier === this.look.touchId) {
                this.look.current.set(x, y);
                const deltaX = this.look.current.x - this.look.start.x;
                const deltaY = this.look.current.y - this.look.start.y;
                this.euler.setFromQuaternion(this.camera.quaternion);
                this.euler.y -= deltaX * 0.002;
                this.euler.x -= deltaY * 0.002;
                this.euler.x = Math.max(Math.PI / 2 - this.maxPolarAngle, Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x));
                this.camera.quaternion.setFromEuler(this.euler);
                this.look.start.copy(this.look.current);
            }
        }
    }

    _onTouchEnd(event) {
        for (const touch of event.changedTouches) {
            if (touch.identifier === this.joystick.touchId) {
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.joystick.thumb.style.transform = `translate(0px, 0px)`;
                this.direction.set(0,0,0);
            } else if (touch.identifier === this.look.touchId) {
                this.look.active = false;
                this.look.touchId = null;
            }
        }
    }
}
