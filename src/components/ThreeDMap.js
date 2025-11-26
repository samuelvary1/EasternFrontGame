// ThreeDMap - 3D map visualization using Three.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ThreeDMap({ 
  regions = [],
  brigades = [],
  playerFaction = 'ukraine',
  onRegionPress 
}) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; }
    body { 
      overflow: hidden; 
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      touch-action: none;
    }
    #canvas-container { 
      width: 100vw; 
      height: 100vh;
      position: relative;
    }
    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      max-width: 200px;
      pointer-events: none;
      display: none;
    }
    #controls {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px;
      border-radius: 8px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="info"></div>
  <div id="controls">
    Drag to rotate • Pinch to zoom
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    const regions = ${JSON.stringify(regions)};
    const brigades = ${JSON.stringify(brigades)};
    const playerFaction = '${playerFaction}';
    
    let scene, camera, renderer, raycaster, mouse;
    let regionMeshes = [];
    let brigadeMeshes = [];
    let isDragging = false;
    let previousTouch = null;
    let cameraAngle = 0;
    let cameraHeight = 30;
    let cameraDistance = 60;
    
    // Region positions matching EnhancedMapScreen
    const regionPositions = {
      'lviv': { x: -25, z: 0 },
      'zhytomyr': { x: -15, z: -5 },
      'kyiv': { x: -10, z: -8 },
      'chernihiv': { x: -5, z: -12 },
      'sumy': { x: 0, z: -15 },
      'vinnytsia': { x: -15, z: 5 },
      'cherkasy': { x: -10, z: 3 },
      'poltava': { x: -3, z: -5 },
      'kharkiv': { x: 5, z: -10 },
      'kirovohrad': { x: -8, z: 10 },
      'dnipro': { x: 0, z: 8 },
      'luhansk': { x: 10, z: -5 },
      'mykolaiv': { x: -10, z: 18 },
      'kherson': { x: -3, z: 20 },
      'zaporizhzhia': { x: 5, z: 15 },
      'donetsk': { x: 12, z: 10 },
      'crimea': { x: 0, z: 28 },
    };
    
    function init() {
      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.Fog(0x0f172a, 40, 100);
      
      // Camera
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
      updateCameraPosition();
      
      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      document.getElementById('canvas-container').appendChild(renderer.domElement);
      
      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(20, 40, 20);
      directionalLight.castShadow = true;
      directionalLight.shadow.camera.left = -50;
      directionalLight.shadow.camera.right = 50;
      directionalLight.shadow.camera.top = 50;
      directionalLight.shadow.camera.bottom = -50;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);
      
      // Ground plane
      const groundGeometry = new THREE.PlaneGeometry(100, 120);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b,
        roughness: 0.8,
        metalness: 0.2
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -2;
      ground.receiveShadow = true;
      scene.add(ground);
      
      // Grid helper
      const gridHelper = new THREE.GridHelper(100, 20, 0x334155, 0x1e293b);
      gridHelper.position.y = -1.9;
      scene.add(gridHelper);
      
      // Create regions
      createRegions();
      
      // Create brigades
      createBrigades();
      
      // Raycaster for interaction
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Touch events
      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });
      
      // Mouse events (for testing in browser)
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      
      // Animation
      animate();
    }
    
    function createRegions() {
      regions.forEach(region => {
        const pos = regionPositions[region.id] || { x: 0, z: 0 };
        
        // Region platform
        const size = region.strategic ? 6 : 4;
        const height = region.strategic ? 1.5 : 1;
        const geometry = new THREE.CylinderGeometry(size, size - 0.5, height, 8);
        
        let color;
        if (region.control === 'ukraine') {
          color = 0x3b82f6; // Blue
        } else if (region.control === 'russia') {
          color = 0xef4444; // Red
        } else {
          color = 0xf59e0b; // Orange (contested)
        }
        
        const material = new THREE.MeshStandardMaterial({ 
          color: color,
          roughness: 0.6,
          metalness: 0.3,
          emissive: color,
          emissiveIntensity: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x, height / 2 - 1, pos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'region', data: region };
        
        scene.add(mesh);
        regionMeshes.push(mesh);
        
        // Add border ring
        const ringGeometry = new THREE.TorusGeometry(size, 0.15, 8, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(pos.x, height - 1, pos.z);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
        
        // Strategic marker
        if (region.strategic) {
          const starGeometry = new THREE.SphereGeometry(0.5, 8, 8);
          const starMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.5
          });
          const star = new THREE.Mesh(starGeometry, starMaterial);
          star.position.set(pos.x, height + 1, pos.z);
          scene.add(star);
        }
      });
    }
    
    function createBrigades() {
      brigades.forEach(brigade => {
        if (!brigade.regionId) return;
        
        const region = regions.find(r => r.id === brigade.regionId);
        if (!region) return;
        
        const pos = regionPositions[region.id] || { x: 0, z: 0 };
        const offset = Math.random() * 3 - 1.5;
        
        // Brigade unit (small cube/tank shape)
        const geometry = new THREE.BoxGeometry(1, 0.8, 1.5);
        const isPlayer = brigade.faction === playerFaction;
        const color = isPlayer ? 0x10b981 : 0xdc2626;
        
        const material = new THREE.MeshStandardMaterial({ 
          color: color,
          roughness: 0.4,
          metalness: 0.6
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x + offset, 1, pos.z + offset);
        mesh.castShadow = true;
        mesh.userData = { type: 'brigade', data: brigade };
        
        scene.add(mesh);
        brigadeMeshes.push(mesh);
        
        // Add turret
        const turretGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8);
        const turret = new THREE.Mesh(turretGeometry, material);
        turret.position.set(pos.x + offset, 1.6, pos.z + offset);
        scene.add(turret);
      });
    }
    
    function updateCameraPosition() {
      const angle = cameraAngle * Math.PI / 180;
      camera.position.x = Math.sin(angle) * cameraDistance;
      camera.position.y = cameraHeight;
      camera.position.z = Math.cos(angle) * cameraDistance;
      camera.lookAt(0, 0, 10);
    }
    
    function onTouchStart(event) {
      event.preventDefault();
      if (event.touches.length === 1) {
        isDragging = true;
        previousTouch = {
          x: event.touches[0].pageX,
          y: event.touches[0].pageY
        };
      }
    }
    
    function onTouchMove(event) {
      event.preventDefault();
      if (isDragging && event.touches.length === 1 && previousTouch) {
        const deltaX = event.touches[0].pageX - previousTouch.x;
        const deltaY = event.touches[0].pageY - previousTouch.y;
        
        cameraAngle -= deltaX * 0.3;
        cameraHeight = Math.max(15, Math.min(50, cameraHeight - deltaY * 0.1));
        
        updateCameraPosition();
        
        previousTouch = {
          x: event.touches[0].pageX,
          y: event.touches[0].pageY
        };
      } else if (event.touches.length === 2) {
        // Pinch to zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) +
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        
        if (previousTouch && previousTouch.distance) {
          const delta = distance - previousTouch.distance;
          cameraDistance = Math.max(30, Math.min(100, cameraDistance - delta * 0.1));
          updateCameraPosition();
        }
        
        previousTouch = { distance: distance };
      }
    }
    
    function onTouchEnd(event) {
      event.preventDefault();
      isDragging = false;
      previousTouch = null;
    }
    
    function onMouseDown(event) {
      isDragging = true;
      previousTouch = { x: event.clientX, y: event.clientY };
    }
    
    function onMouseMove(event) {
      if (isDragging && previousTouch) {
        const deltaX = event.clientX - previousTouch.x;
        const deltaY = event.clientY - previousTouch.y;
        
        cameraAngle -= deltaX * 0.3;
        cameraHeight = Math.max(15, Math.min(50, cameraHeight - deltaY * 0.1));
        
        updateCameraPosition();
        
        previousTouch = { x: event.clientX, y: event.clientY };
      }
    }
    
    function onMouseUp(event) {
      isDragging = false;
      previousTouch = null;
    }
    
    function animate() {
      requestAnimationFrame(animate);
      
      // Gentle rotation animation
      regionMeshes.forEach((mesh, index) => {
        mesh.rotation.y += 0.002;
      });
      
      // Brigade bobbing animation
      brigadeMeshes.forEach((mesh, index) => {
        mesh.position.y = 1 + Math.sin(Date.now() * 0.001 + index) * 0.1;
      });
      
      renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    init();
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        scrollEnabled={false}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'regionPress' && onRegionPress) {
            onRegionPress(data.region);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
