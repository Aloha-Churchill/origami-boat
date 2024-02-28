import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

let scene, camera, renderer, controls, material;
let light1, light2, light3, light4;
let origamiBoat;


const clock = new THREE.Clock();

const maxRipples = 5; 
let rippleStartTimes = Array(maxRipples).fill(-1.0);

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float time;
uniform float rippleStartTimes[${maxRipples}];
varying vec2 vUv;

void main() {
    vec3 color = vec3(0.0, 0.5, 1.0); 
    float alpha = 0.0; 

    for (int i = 0; i < ${maxRipples}; i++) {
        if (rippleStartTimes[i] > 0.0) {
            float rippleAge = time - rippleStartTimes[i]; 
            float distanceFromCenter = distance(vUv, vec2(0.5, 0.5));

            float radius = rippleAge * 0.02;

            float edgeThickness = 0.005;

            float innerEdge = radius - edgeThickness / 2.0;
            float outerEdge = radius + edgeThickness / 2.0;

            float ringGradient = smoothstep(innerEdge, outerEdge, distanceFromCenter) - smoothstep(outerEdge, outerEdge + edgeThickness, distanceFromCenter);

            float fadeOut = 1.0 - rippleAge * 0.2;

            alpha = max(alpha, ringGradient * fadeOut);
        }
    }

    gl_FragColor = vec4(color, alpha);
}

`;


function initScene() {
    scene = new THREE.Scene();
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Position the camera to the side of the scene
    camera.position.set(2, 1, -3); 

    // Point the camera towards the center of the scene
    camera.lookAt(scene.position);
}


function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
}


function initLighting() {
    const light_shape = new THREE.SphereGeometry(0.01, 16, 8);

    light1 = new THREE.PointLight(0xffdf8e, 1, 100);
    light1.add(new THREE.Mesh(light_shape, new THREE.MeshBasicMaterial({ color: 0xffdf8e })));
    scene.add(light1);

    // add blue light
    light2 = new THREE.PointLight(0xffdf8e, 1, 100);
    light2.add(new THREE.Mesh(light_shape, new THREE.MeshBasicMaterial({ color: 0xffdf8e })));
    scene.add(light2);

    // add green light
    light3 = new THREE.PointLight(0xffdf8e, 1, 100);
    light3.add(new THREE.Mesh(light_shape, new THREE.MeshBasicMaterial({ color: 0xffdf8e })));
    scene.add(light3);

    // add red light
    light4 = new THREE.PointLight(0xffdf8e, 1, 100);
    light4.add(new THREE.Mesh(light_shape, new THREE.MeshBasicMaterial({ color: 0xffdf8e })));
    scene.add(light4);

}

function createRipple() {
    const currentTime = performance.now() / 1000;
    const oldestRippleIndex = rippleStartTimes.indexOf(Math.min(...rippleStartTimes));
    rippleStartTimes[oldestRippleIndex] = currentTime;
    setTimeout(createRipple, Math.random() * 2000 + 500);
}

function initRipple() {
    const geometry = new THREE.PlaneGeometry(10, 10, 32, 32);
    material = new THREE.ShaderMaterial({
        uniforms: {
            time: { type: 'f', value: 0 },
            rippleStartTimes: { type: 'fv1', value: rippleStartTimes },
        },
        vertexShader,
        fragmentShader,
        transparent: true
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    plane.position.set(2, -1, 1); // Center of the scene
    plane.rotation.x = -Math.PI / 2;
    plane.rotation.y = -Math.PI/16;
    plane.renderOrder = 0; // Ensure plane is rendered first
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load('origami_boat.gltf', function(gltf) {
        origamiBoat = gltf.scene;
        origamiBoat.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    specular: 0x111111,
                    shininess: 200
                }); // Ensure the model has its own material
                // child.material = new THREE.MeshStandardMaterial();
            }
        });
        scene.add(origamiBoat);
        origamiBoat.position.set(2, -1, 1); // Center of the plane -- want to be off center
        origamiBoat.scale.set(10, 10, 10); 
        origamiBoat.rotation.x = -Math.PI / 2;
        origamiBoat.rotation.y = -Math.PI/16;
        // origamiBoat.rotation.z ; 
        origamiBoat.renderOrder = 1; // Render after the plane
    });
}


function moveLights() {
    if (!origamiBoat || !light1 || !light2 || !light3 || !light4) {
        // ifvOne or more objects are not defined yet, skip this frame
        return;
    }

    // Scale down the time to slow down the light movement a lot
    const time = clock.getElapsedTime() * 0.05; 
    
    const baseFrequency = 7.5; // play wit this num for oscillation speeds

    const lights = [light1, light2, light3, light4];
    lights.forEach((light, index) => {

        const amplitude = 0.75; 

        // Calculate new positions with reduced frequency and scaled time
        light.position.x = origamiBoat.position.x + amplitude * Math.sin(baseFrequency * time + index * Math.PI / 2);
        light.position.z = origamiBoat.position.z + amplitude * Math.cos(baseFrequency * time + index * Math.PI / 2);

        // Slightly adjust the Y position for a gentle floating effect
        light.position.y = origamiBoat.position.y + 0.5 + 0.05 * Math.sin(baseFrequency * time); 
    });
}




function animate() {
    requestAnimationFrame(animate);
    material.uniforms.time.value = performance.now() / 1000;
    controls.update();
    moveLights();
    renderer.render(scene, camera);
}

function init() {
    initScene();
    initCamera();
    initRenderer();
    initControls();
    initLighting();
    initRipple();
    createRipple();
    loadModel();
    animate();
}

init();