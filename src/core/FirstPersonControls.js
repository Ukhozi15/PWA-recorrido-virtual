// src/core/FirstPersonControls.js

import * as THREE from 'three';
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export class FirstPersonControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.controls = new PointerLockControls(camera, domElement);

        this.playerHeight = 1.7;
        // ✨ CAMBIO: Añadimos un pequeño margen para evitar el jittering por errores de precisión.
        this.groundCheckOffset = 0.1; 
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.gravity = 30.0;
        this.acceleration = 50.0;
        this.deceleration = 10.0;

        this.collisionObjects = [];
        this.maxStepHeight = 0.4;
        this.downRaycaster = new THREE.Raycaster();
        this.horizontalRaycaster = new THREE.Raycaster();
        this.bodyRaycaster = new THREE.Raycaster();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isGrounded = false;

        this.headBobFrequency = 8;
        this.headBobAmplitude = 0.05;
        this.headBobTimer = 0;
        
        this.isTouchDevice = 'ontouchstart' in window;
        
        this.lookSurface = document.getElementById('mobile-controls');
        
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
        
        this.desktopLookSpeed = 0.0012;
        this.touchLookSpeed = 0.0022;
        this.lookDamping = 0.2;
        this.lookVelocity = new THREE.Vector2();
        this.targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');

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
        
        if (this.controls.isLocked && !this.isTouchDevice) {
            this.euler.y -= this.lookVelocity.x;
            this.euler.x -= this.lookVelocity.y;
            this.euler.x = Math.max(Math.PI / 2 - this.maxPolarAngle, Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x));
            this.camera.quaternion.setFromEuler(this.euler);
            this.lookVelocity.x *= (1 - this.lookDamping);
            this.lookVelocity.y *= (1 - this.lookDamping);
        }

        if (this.joystick.active) {
            const joystickDelta = this.joystick.current.clone().sub(this.joystick.center);
            const moveSpeed = joystickDelta.length() / (this.joystick.container.clientWidth / 2);
            if (moveSpeed > 0.1) {
                const angle = Math.atan2(joystickDelta.y, joystickDelta.x);
                this.direction.z = -Math.sin(angle) * moveSpeed;
                this.direction.x = Math.cos(angle) * moveSpeed;
            } else { this.direction.set(0,0,0); }
        } else {
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        }
        this.direction.normalize();

        // --- LÓGICA DE FÍSICA ---
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
        
        // --- LÓGICA VISUAL (SEPARADA DE LA FÍSICA) ---
        this._updateHeadBob(delta);
    }
    
    _snapToGround() {
        const playerPosition = this.controls.object.position;
        const snapRaycaster = new THREE.Raycaster(new THREE.Vector3(playerPosition.x, 100, playerPosition.z), new THREE.Vector3(0, -1, 0));
        const intersections = snapRaycaster.intersectObjects(this.collisionObjects, true);
        if (intersections.length > 0) {
            playerPosition.y = intersections[0].point.y + this.playerHeight;
        }
    }
    
    _updateGravity(delta) {
        this.isGrounded = false;
        const playerPosition = this.controls.object.position;
        this.downRaycaster.set(playerPosition, new THREE.Vector3(0, -1, 0));
        const intersections = this.downRaycaster.intersectObjects(this.collisionObjects, true);
        
        // ✨ CAMBIO: Usamos el offset para la comprobación del suelo
        if (intersections.length > 0 && intersections[0].distance <= this.playerHeight + this.groundCheckOffset) {
            // Si estamos en el suelo o muy cerca, nos ajustamos a la altura correcta
            if (intersections[0].distance < this.playerHeight - 0.01) {
                playerPosition.y = intersections[0].point.y + this.playerHeight;
            }
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * delta;
        }
    }

    _handleHorizontalCollisions() {
        const horizontalDirection = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
        if (horizontalDirection.lengthSq() === 0) return;

        const playerPosition = this.controls.object.position;
        const collisionThreshold = 0.5;

        const bodyPosition = new THREE.Vector3(playerPosition.x, playerPosition.y - this.playerHeight / 2, playerPosition.z);
        this.bodyRaycaster.set(bodyPosition, horizontalDirection);
        const bodyIntersections = this.bodyRaycaster.intersectObjects(this.collisionObjects, true);

        if (bodyIntersections.length > 0 && bodyIntersections[0].distance < collisionThreshold) {
            this.velocity.x = 0;
            this.velocity.z = 0;
            return; 
        }

        this.horizontalRaycaster.set(playerPosition, horizontalDirection);
        const intersections = this.horizontalRaycaster.intersectObjects(this.collisionObjects, true);

        if (intersections.length > 0 && intersections[0].distance < collisionThreshold) {
            const contactPoint = intersections[0].point;
            const groundHeightAtContact = this._getGroundHeight(contactPoint);
            const currentGroundHeight = playerPosition.y - this.playerHeight;
            const heightDifference = groundHeightAtContact - currentGroundHeight;

            if (heightDifference > 0 && heightDifference < this.maxStepHeight) {
                playerPosition.y += heightDifference;
            } else {
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
        // ✨ CAMBIO: El head-bob ahora solo modifica la cámara, no el objeto del jugador.
        // Esto lo convierte en un efecto 100% visual y lo desacopla de la física.
        if (this.isGrounded && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1)) {
            this.headBobTimer += delta * this.headBobFrequency;
            this.camera.position.y = Math.sin(this.headBobTimer) * this.headBobAmplitude;
        } else {
            this.headBobTimer = 0;
            // Suaviza el retorno a la posición original
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 0, delta * 10);
        }
    }

    _setupEventListeners() {
        this._onMouseMove = this._onMouseMove.bind(this);

        if (this.isTouchDevice) {
            this.joystick.container.addEventListener('touchstart', this._onJoystickStart.bind(this), { passive: false });
            this.joystick.container.addEventListener('touchmove', this._onJoystickMove.bind(this), { passive: false });
            this.joystick.container.addEventListener('touchend', this._onJoystickEnd.bind(this));

            this.lookSurface.addEventListener('touchstart', this._onLookStart.bind(this), { passive: false });
            this.lookSurface.addEventListener('touchmove', this._onLookMove.bind(this), { passive: false });
            this.lookSurface.addEventListener('touchend', this._onLookEnd.bind(this));
            
        } else {
            this.controls.addEventListener('lock', () => document.addEventListener('mousemove', this._onMouseMove, false));
            this.controls.addEventListener('unlock', () => document.removeEventListener('mousemove', this._onMouseMove, false));
            this.domElement.addEventListener('click', () => this.controls.lock());
            document.addEventListener('keydown', this._onKeyDown.bind(this));
            document.addEventListener('keyup', this._onKeyUp.bind(this));
        }
    }

    _onMouseMove(event) {
        if (!this.controls.isLocked) return;
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        this.lookVelocity.x += movementX * this.desktopLookSpeed;
        this.lookVelocity.y += movementY * this.desktopLookSpeed;
    }

    _onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
        }
    }

    _onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
            case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
            case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
            case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
        }
    }

    _onJoystickStart(event) {
        event.stopPropagation();
        this.joystick.active = true;
        const touch = event.changedTouches[0];
        this.joystick.touchId = touch.identifier;
        const rect = this.joystick.container.getBoundingClientRect();
        this.joystick.center.set(rect.left + rect.width / 2, rect.top + rect.height / 2);
        this.joystick.current.set(touch.clientX, touch.clientY);
    }

    _onJoystickMove(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.joystick.active) return;
        
        const touch = Array.from(event.changedTouches).find(t => t.identifier === this.joystick.touchId);
        if (!touch) return;
        
        this.joystick.current.set(touch.clientX, touch.clientY);
        const delta = this.joystick.current.clone().sub(this.joystick.center);
        const maxDist = this.joystick.container.clientWidth / 2;
        if (delta.length() > maxDist) {
            delta.normalize().multiplyScalar(maxDist);
        }
        this.joystick.thumb.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
    }

    _onJoystickEnd(event) {
        event.stopPropagation();
        const touch = Array.from(event.changedTouches).find(t => t.identifier === this.joystick.touchId);
        if (!touch) return;

        this.joystick.active = false;
        this.joystick.touchId = null;
        this.joystick.thumb.style.transform = `translate(0px, 0px)`;
        this.direction.set(0, 0, 0);
    }

    _onLookStart(event) {
        const targetElement = event.target;
        if (targetElement.closest('#joystick-container') || targetElement.closest('#action-button-container')) {
            return;
        }
        
        this.look.active = true;
        const touch = event.changedTouches[0];
        this.look.touchId = touch.identifier;
        this.look.start.set(touch.clientX, touch.clientY);
        this.look.current.set(touch.clientX, touch.clientY);
    }

    _onLookMove(event) {
        event.preventDefault();
        if (!this.look.active) return;

        const touch = Array.from(event.changedTouches).find(t => t.identifier === this.look.touchId);
        if (!touch) return;

        this.look.current.set(touch.clientX, touch.clientY);
        const deltaX = this.look.current.x - this.look.start.x;
        const deltaY = this.look.current.y - this.look.start.y;
        
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= deltaX * this.touchLookSpeed;
        this.euler.x -= deltaY * this.touchLookSpeed;
        this.euler.x = Math.max(Math.PI / 2 - this.maxPolarAngle, Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
        
        this.look.start.copy(this.look.current);
    }

    _onLookEnd(event) {
        const touch = Array.from(event.changedTouches).find(t => t.identifier === this.look.touchId);
        if (!touch) return;
        
        this.look.active = false;
        this.look.touchId = null;
    }
}
