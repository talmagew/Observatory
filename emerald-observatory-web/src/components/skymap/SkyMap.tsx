import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { DateTime } from 'luxon';
import { AstronomicalService } from '../../services/AstronomicalService';
import { LocationCoordinates } from '../../services/LocationService';

interface SkyMapProps {
  currentTime: DateTime;
  location: LocationCoordinates;
  className?: string;
}

interface CelestialObject {
  name: string;
  position: { azimuth: number; altitude: number };
  magnitude?: number;
  type: 'star' | 'planet' | 'moon' | 'constellation';
  color: string;
  visible: boolean;
}

export function SkyMap({ currentTime, location, className = '' }: SkyMapProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const frameRef = useRef<number>();
  const [isInteractive, setIsInteractive] = useState(true);
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [celestialObjects, setCelestialObjects] = useState<CelestialObject[]>([]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000511);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Celestial sphere
    const sphereGeometry = new THREE.SphereGeometry(100, 64, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x000511,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const celestialSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(celestialSphere);

    // Grid for reference
    const gridHelper = new THREE.PolarGridHelper(100, 8, 8, 64, 0x333333, 0x333333);
    gridHelper.rotateX(Math.PI / 2);
    scene.add(gridHelper);

    // Horizon line
    const horizonGeometry = new THREE.RingGeometry(99, 100, 64);
    const horizonMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    horizon.rotateX(Math.PI / 2);
    scene.add(horizon);

    // Cardinal directions
    const createDirectionLabel = (text: string, azimuth: number) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 64;
      context.fillStyle = '#ffffff';
      context.font = '20px Arial';
      context.textAlign = 'center';
      context.fillText(text, 64, 40);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      
      const azRad = (azimuth * Math.PI) / 180;
      sprite.position.set(
        Math.sin(azRad) * 95,
        0,
        Math.cos(azRad) * 95
      );
      sprite.scale.set(8, 4, 1);
      
      return sprite;
    };

    scene.add(createDirectionLabel('N', 0));
    scene.add(createDirectionLabel('E', 90));
    scene.add(createDirectionLabel('S', 180));
    scene.add(createDirectionLabel('W', 270));

    // Mouse controls
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    const onMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      mouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown || !isInteractive) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;

      // Limit vertical rotation
      targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      if (!isInteractive) return;
      
      const fov = camera.fov + event.deltaY * 0.1;
      camera.fov = Math.max(10, Math.min(120, fov));
      camera.updateProjectionMatrix();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      rotationX += (targetRotationX - rotationX) * 0.1;
      rotationY += (targetRotationY - rotationY) * 0.1;

      camera.rotation.x = rotationX;
      camera.rotation.y = rotationY;

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [isInteractive]);

  // Update celestial objects
  useEffect(() => {
    const updateCelestialObjects = async () => {
      try {
        const astronomicalService = new AstronomicalService();
        
        // Get planetary positions
        const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
        const planetObjects: CelestialObject[] = [];

        for (const planet of planets) {
          try {
            const position = await astronomicalService.getPlanetPosition(planet, currentTime, location);
            if (position.altitude > -10) { // Show planets above -10° altitude
              planetObjects.push({
                name: planet,
                position: {
                  azimuth: position.azimuth,
                  altitude: position.altitude
                },
                magnitude: position.magnitude,
                type: 'planet',
                color: getPlanetColor(planet),
                visible: position.altitude > 0
              });
            }
          } catch (error) {
            console.warn(`Failed to get position for ${planet}:`, error);
          }
        }

        // Get Sun position
        try {
          const sunTimes = await astronomicalService.getSunTimes(currentTime, location);
          if (sunTimes.position) {
            planetObjects.push({
              name: 'Sun',
              position: {
                azimuth: sunTimes.position.azimuth,
                altitude: sunTimes.position.altitude
              },
              type: 'star',
              color: '#FFF44F',
              visible: sunTimes.position.altitude > -18 // Show during twilight
            });
          }
        } catch (error) {
          console.warn('Failed to get Sun position:', error);
        }

        // Get Moon position
        try {
          const moonPhase = await astronomicalService.getMoonPhase(currentTime, location);
          if (moonPhase.position) {
            planetObjects.push({
              name: 'Moon',
              position: {
                azimuth: moonPhase.position.azimuth,
                altitude: moonPhase.position.altitude
              },
              type: 'moon',
              color: '#C0C0C0',
              visible: moonPhase.position.altitude > -5
            });
          }
        } catch (error) {
          console.warn('Failed to get Moon position:', error);
        }

        setCelestialObjects(planetObjects);
      } catch (error) {
        console.error('Error updating celestial objects:', error);
      }
    };

    updateCelestialObjects();
  }, [currentTime, location]);

  // Render celestial objects in 3D scene
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove existing celestial objects
    const objectsToRemove = sceneRef.current.children.filter(child => 
      child.userData.type === 'celestialObject'
    );
    objectsToRemove.forEach(obj => sceneRef.current!.remove(obj));

    // Add new celestial objects
    celestialObjects.forEach(obj => {
      const azRad = (obj.position.azimuth * Math.PI) / 180;
      const altRad = (obj.position.altitude * Math.PI) / 180;

      // Convert to 3D coordinates
      const radius = 90;
      const x = radius * Math.cos(altRad) * Math.sin(azRad);
      const y = radius * Math.sin(altRad);
      const z = radius * Math.cos(altRad) * Math.cos(azRad);

      // Create object representation
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      if (obj.name === 'Sun') {
        geometry = new THREE.SphereGeometry(2, 16, 16);
        material = new THREE.MeshBasicMaterial({ color: obj.color });
      } else if (obj.name === 'Moon') {
        geometry = new THREE.SphereGeometry(1.5, 16, 16);
        material = new THREE.MeshBasicMaterial({ color: obj.color });
      } else {
        geometry = new THREE.SphereGeometry(0.8, 8, 8);
        material = new THREE.MeshBasicMaterial({ color: obj.color });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.userData = { type: 'celestialObject', object: obj };

      // Add glow effect for bright objects
      if (obj.magnitude !== undefined && obj.magnitude < 2) {
        const glowGeometry = new THREE.SphereGeometry(obj.name === 'Sun' ? 3 : 1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: obj.color,
          transparent: true,
          opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(mesh.position);
        sceneRef.current!.add(glow);
      }

      sceneRef.current!.add(mesh);
    });
  }, [celestialObjects]);

  const getPlanetColor = (planet: string): string => {
    const colors: Record<string, string> = {
      Mercury: '#8C7853',
      Venus: '#FFC649',
      Mars: '#CD5C5C',
      Jupiter: '#D8CA9D',
      Saturn: '#FAD5A5'
    };
    return colors[planet] || '#FFFFFF';
  };

  const handleReset = () => {
    if (cameraRef.current) {
      cameraRef.current.rotation.set(0, 0, 0);
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const formatCoordinates = (obj: CelestialObject) => {
    return `Az: ${obj.position.azimuth.toFixed(1)}° Alt: ${obj.position.altitude.toFixed(1)}°`;
  };

  return (
    <div className={`glass-panel overflow-hidden ${className}`}>
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>🌌</span>
            Interactive Sky Map
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInteractive(!isInteractive)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isInteractive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {isInteractive ? 'Interactive' : 'Static'}
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary text-sm"
            >
              Reset View
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div 
          ref={mountRef} 
          className="w-full h-96 bg-black/20"
          style={{ minHeight: '400px' }}
        />

        {/* Object Info Panel */}
        {selectedObject && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 max-w-xs">
            <h4 className="font-semibold text-white mb-2">{selectedObject.name}</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>{formatCoordinates(selectedObject)}</div>
              {selectedObject.magnitude && (
                <div>Magnitude: {selectedObject.magnitude.toFixed(1)}</div>
              )}
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedObject.color }}
                />
                <span className="capitalize">{selectedObject.type}</span>
              </div>
              <div className={`text-xs ${selectedObject.visible ? 'text-green-300' : 'text-orange-300'}`}>
                {selectedObject.visible ? 'Visible' : 'Below horizon'}
              </div>
            </div>
          </div>
        )}

        {/* Object List */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 max-w-xs">
          <h4 className="font-semibold text-white mb-2">Celestial Objects</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {celestialObjects
              .sort((a, b) => b.position.altitude - a.position.altitude)
              .map((obj, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedObject(obj)}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    selectedObject?.name === obj.name
                      ? 'bg-blue-600/50 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: obj.color }}
                    />
                    <span className="font-medium">{obj.name}</span>
                    {obj.magnitude && (
                      <span className="text-xs opacity-70">
                        mag {obj.magnitude.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70">
                    Alt: {obj.position.altitude.toFixed(0)}°
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Controls Help */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-3">
          <div className="text-xs text-gray-300 space-y-1">
            <div>🖱️ Mouse: Look around</div>
            <div>🎡 Scroll: Zoom in/out</div>
            <div>📍 Click objects for details</div>
          </div>
        </div>
      </div>
    </div>
  );
} 