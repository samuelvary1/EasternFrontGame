// ThreeDDiceRoll component - 3D dice rolling animation using Three.js

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

// Helper function to get die emoji based on value
const getDieEmoji = (value, color) => {
  // Unicode dice faces
  const diceFaces = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅',
  };
  return diceFaces[value] || '⚀';
};

export default function ThreeDDiceRoll({ 
  visible, 
  attackerName = 'Attacker',
  defenderName = 'Defender',
  attackerDice = [], 
  defenderDice = [], 
  comparisons = [],
  outcome = '',
  attackerBrigades = [], // Array of brigade names/ids for dice mapping
  defenderBrigades = [],
  attackerBrigadeInfo = null, // {name, type, strength, morale}
  defenderInfo = null, // {name, strength, terrain}
  combatResults = null, // {attackerLosses, moraleChange, defenderLosses}
  description = '',
  onComplete 
}) {
  const [stage, setStage] = useState('rolling'); // rolling -> showing -> comparing -> complete
  const [currentComparison, setCurrentComparison] = useState(0);
  const webViewRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setStage('rolling');
      setCurrentComparison(0);
      return;
    }

    // Stage timing
    setTimeout(() => {
      setStage('showing');
      setTimeout(() => {
        setStage('comparing');
      }, 1500);
    }, 3000); // 3 seconds for dice to roll and settle
  }, [visible]);

  useEffect(() => {
    if (stage === 'comparing' && currentComparison < comparisons.length) {
      const timer = setTimeout(() => {
        setCurrentComparison(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (stage === 'comparing' && currentComparison >= comparisons.length) {
      setTimeout(() => {
        setStage('complete');
        // Don't auto-complete - wait for user to close
      }, 1500);
    }
  }, [stage, currentComparison, comparisons.length]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; }
    body { 
      overflow: hidden; 
      background: linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #canvas-container { 
      width: 100vw; 
      height: 100vh; 
      position: relative;
    }
    canvas { 
      display: block; 
      width: 100%;
      height: 100%;
    }
    #status {
      position: absolute;
      top: 20px;
      left: 0;
      right: 0;
      text-align: center;
      color: #f59e0b;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      z-index: 10;
    }
  </style>
</head>
<body>
  <div id="canvas-container">
    <div id="status">Rolling dice...</div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    const attackerDice = ${JSON.stringify(attackerDice)};
    const defenderDice = ${JSON.stringify(defenderDice)};
    
    let scene, camera, renderer;
    let diceObjects = [];
    let rolling = true;
    
    function init() {
      // Scene
      scene = new THREE.Scene();
      scene.background = null;
      
      // Camera
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 10, 14);
      camera.lookAt(0, 0, 0);
      
      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      document.getElementById('canvas-container').appendChild(renderer.domElement);
      
      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Table
      const tableGeometry = new THREE.PlaneGeometry(20, 20);
      const tableMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d5016,
        roughness: 0.8 
      });
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.rotation.x = -Math.PI / 2;
      table.position.y = -2.2;
      table.receiveShadow = true;
      scene.add(table);
      
      // Create dice
      createDice();
      
      // Animation
      animate();
    }
    
    function createDie(value, position, color) {
      const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      
      // Three.js BoxGeometry face order: right(+X), left(-X), top(+Y), bottom(-Y), front(+Z), back(-Z)
      // We want the die to show 'value' when face index 2 (top/+Y) is facing up
      // Standard die: opposite faces sum to 7 (1-6, 2-5, 3-4)
      // So we put the desired value on the top face, and arrange other faces correctly
      const materials = [];
      
      // Create all 6 face materials, but we'll draw the correct value on each based on the desired result
      // For simplicity: draw the same value on all faces, then we'll rotate to show the correct one
      // Better: draw the correct standard die faces
      const faceValues = [
        7 - value,  // right face (will be opposite when rotated)
        value,      // left face (will be top when rotated 90° on Z)
        value,      // top face (will be top when no rotation)
        7 - value,  // bottom face (opposite of top)
        value,      // front face (will be top when rotated 90° on X)
        7 - value   // back face (opposite of front)
      ];
      
      for (let i = 0; i < 6; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Die face background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 128, 128);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 120, 120);
        
        // Dots
        ctx.fillStyle = '#ffffff';
        drawDots(ctx, faceValues[i]);
        
        const texture = new THREE.CanvasTexture(canvas);
        materials.push(new THREE.MeshStandardMaterial({ map: texture }));
      }
      
      const die = new THREE.Mesh(geometry, materials);
      die.position.copy(position);
      die.castShadow = true;
      die.receiveShadow = true;
      
      // Random initial rotation and velocity
      die.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      die.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.5,
        (Math.random() - 0.5) * 0.3
      );
      die.userData.rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      die.userData.finalValue = value;
      die.userData.settled = false;
      
      return die;
    }
    
    function drawDots(ctx, count) {
      const positions = {
        1: [[64, 64]],
        2: [[32, 32], [96, 96]],
        3: [[32, 32], [64, 64], [96, 96]],
        4: [[32, 32], [96, 32], [32, 96], [96, 96]],
        5: [[32, 32], [96, 32], [64, 64], [32, 96], [96, 96]],
        6: [[32, 32], [96, 32], [32, 64], [96, 64], [32, 96], [96, 96]]
      };
      
      const dots = positions[count] || positions[1];
      dots.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    function createDice() {
      // Place dice left-to-right in sorted order, no randomization in x
      // Center dice group for any count
      const attackerCount = attackerDice.length;
      const defenderCount = defenderDice.length;
      const attackerStartX = -((attackerCount - 1) * 1.2) / 2;
      const defenderStartX = -((defenderCount - 1) * 1.2) / 2;

      // Attacker dice (blue, z = -2)
      attackerDice.forEach((value, index) => {
        const x = attackerStartX + index * 1.2;
        const position = new THREE.Vector3(x, 3, -2);
        const die = createDie(value, position, '#1e40af');
        diceObjects.push(die);
        scene.add(die);
      });

      // Defender dice (red, z = 2)
      defenderDice.forEach((value, index) => {
        const x = defenderStartX + index * 1.2;
        const position = new THREE.Vector3(x, 3, 2);
        const die = createDie(value, position, '#991b1b');
        diceObjects.push(die);
        scene.add(die);
      });
    }
    
    function animate() {
      requestAnimationFrame(animate);
      
      if (rolling) {
        diceObjects.forEach(die => {
          if (!die.userData.settled) {
            // Apply gravity
            die.userData.velocity.y -= 0.02;
            die.position.add(die.userData.velocity);
            
            // Apply rotation
            die.rotation.x += die.userData.rotationVelocity.x;
            die.rotation.y += die.userData.rotationVelocity.y;
            die.rotation.z += die.userData.rotationVelocity.z;
            
            // Boundary checks - bounce off edges
            const boundary = 8;
            
            // Left/Right boundaries
            if (die.position.x < -boundary) {
              die.position.x = -boundary;
              die.userData.velocity.x *= -0.6;
            } else if (die.position.x > boundary) {
              die.position.x = boundary;
              die.userData.velocity.x *= -0.6;
            }
            
            // Front/Back boundaries
            if (die.position.z < -boundary) {
              die.position.z = -boundary;
              die.userData.velocity.z *= -0.6;
            } else if (die.position.z > boundary) {
              die.position.z = boundary;
              die.userData.velocity.z *= -0.6;
            }
            
            // Dice-to-dice collision detection
            diceObjects.forEach(otherDie => {
              if (otherDie !== die) {
                const dx = die.position.x - otherDie.position.x;
                const dy = die.position.y - otherDie.position.y;
                const dz = die.position.z - otherDie.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const minDistance = 1.3; // Dice size is 1.2, so minimum distance is slightly larger
                
                if (distance < minDistance) {
                  // Calculate collision normal
                  const nx = dx / distance;
                  const ny = dy / distance;
                  const nz = dz / distance;
                  
                  // Separate the dice
                  const overlap = minDistance - distance;
                  die.position.x += nx * overlap * 0.5;
                  die.position.y += ny * overlap * 0.5;
                  die.position.z += nz * overlap * 0.5;
                  
                  // Apply collision response (bounce)
                  const relativeVelocity = die.userData.velocity.clone().sub(otherDie.userData.velocity);
                  const velocityAlongNormal = relativeVelocity.dot(new THREE.Vector3(nx, ny, nz));
                  
                  if (velocityAlongNormal < 0) {
                    const restitution = 0.5; // Bounciness
                    const impulse = -(1 + restitution) * velocityAlongNormal / 2;
                    
                    die.userData.velocity.x += impulse * nx;
                    die.userData.velocity.y += impulse * ny;
                    die.userData.velocity.z += impulse * nz;
                  }
                }
              }
            });
            
            // Bounce on table
            if (die.position.y < -1.6) {
              die.position.y = -1.6;
              die.userData.velocity.y *= -0.5; // Reduced bounce
              die.userData.velocity.x *= 0.7;
              die.userData.velocity.z *= 0.7;
              die.userData.rotationVelocity.multiplyScalar(0.7);
              
              // Stop if velocity is very low
              if (Math.abs(die.userData.velocity.y) < 0.02 && 
                  die.userData.velocity.length() < 0.05) {
                die.userData.velocity.set(0, 0, 0);
                die.userData.rotationVelocity.set(0, 0, 0);
                
                // Snap to show correct face up
                snapDieToValue(die, die.userData.finalValue);
                die.userData.settled = true;
              }
            }
          }
        });
        
        // Check if all dice have stopped
        const allStopped = diceObjects.every(die => die.userData.settled);
        
        if (allStopped) {
          rolling = false;
          document.getElementById('status').textContent = 'Results ready!';
          setTimeout(() => {
            document.getElementById('status').style.display = 'none';
          }, 1000);
        }
      }
      
      renderer.render(scene, camera);
    }
    
    function snapDieToValue(die, value) {
      // Rotate die so the correct face is facing up (top = +Y axis)
      // Since we put 'value' on the top, left, and front faces, we can rotate to any of them
      // Simplest: use no rotation (top face is already up)
      const rotation = { x: 0, y: 0, z: 0 };
      
      // Smoothly interpolate to final rotation
      const steps = 20;
      let step = 0;
      const startRotation = { x: die.rotation.x, y: die.rotation.y, z: die.rotation.z };
      
      function interpolate() {
        if (step < steps) {
          const progress = step / steps;
          die.rotation.x = startRotation.x + (rotation.x - startRotation.x) * progress;
          die.rotation.y = startRotation.y + (rotation.y - startRotation.y) * progress;
          die.rotation.z = startRotation.z + (rotation.z - startRotation.z) * progress;
          step++;
          requestAnimationFrame(interpolate);
        } else {
          die.rotation.set(rotation.x, rotation.y, rotation.z);
        }
      }
      interpolate();
    }
    
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

  if (!visible) return null;

  // Always show summary, dice legend, and results after animation
  // Color legend and dice explanations
  // Assume blue = you, red = enemy (swap if needed)
  const youColor = '#1e40af';
  const enemyColor = '#991b1b';

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Attacking and Defending forces */}
        <View style={styles.forcesContainer}>
          <View style={styles.forceBox}>
            <Text style={styles.forceLabel}>ATTACKING</Text>
            <Text style={styles.forceName}>{attackerName}</Text>
            {attackerBrigadeInfo && (
              <View style={styles.brigadesBox}>
                <Text style={styles.brigadeText}>{attackerBrigadeInfo.type}</Text>
                <Text style={styles.brigadeDetailText}>Str: {attackerBrigadeInfo.strength} | Morale: {attackerBrigadeInfo.morale}</Text>
              </View>
            )}
            {attackerBrigades.length > 0 && (
              <View style={styles.brigadesBox}>
                {attackerBrigades.map((b, i) => (
                  <Text key={i} style={styles.brigadeText}>• {b}</Text>
                ))}
              </View>
            )}
            <Text style={styles.diceCount}>{attackerDice.length} {attackerDice.length === 1 ? 'die' : 'dice'}</Text>
          </View>
          
          <Text style={styles.versus}>VS</Text>
          
          <View style={styles.forceBox}>
            <Text style={styles.forceLabel}>DEFENDING</Text>
            <Text style={styles.forceName}>{defenderName}</Text>
            {defenderInfo && (
              <View style={styles.brigadesBox}>
                <Text style={styles.brigadeText}>Russian Forces</Text>
                <Text style={styles.brigadeDetailText}>Str: {defenderInfo.strength} | Terrain: {defenderInfo.terrain}</Text>
              </View>
            )}
            {defenderBrigades.length > 0 && (
              <View style={styles.brigadesBox}>
                {defenderBrigades.map((b, i) => (
                  <Text key={i} style={styles.brigadeText}>• {b}</Text>
                ))}
              </View>
            )}
            <Text style={styles.diceCount}>{defenderDice.length} {defenderDice.length === 1 ? 'die' : 'dice'}</Text>
          </View>
        </View>

        {/* Color legend */}
        <View style={styles.colorLegendRow}>
          <View style={styles.colorLegendCol}>
            <View style={[styles.colorSwatch, { backgroundColor: youColor }]} />
            <Text style={styles.colorLegendLabel}>You</Text>
          </View>
          <View style={styles.colorLegendCol}>
            <View style={[styles.colorSwatch, { backgroundColor: enemyColor }]} />
            <Text style={styles.colorLegendLabel}>Enemy</Text>
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendCol}>
            <Text style={styles.legendTitle}>Your Dice (sorted):</Text>
            {(stage === 'showing' || stage === 'comparing' || stage === 'complete') && (
              <View style={styles.diceDisplayRow}>
                {attackerDice.map((val, i) => (
                  <View key={i} style={styles.diceItem}>
                    <Text style={styles.dieEmoji}>{getDieEmoji(val, 'blue')}</Text>
                    <Text style={styles.dieValueText}>{val}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={styles.legendCol}>
            <Text style={styles.legendTitle}>Enemy Dice (sorted):</Text>
            {(stage === 'showing' || stage === 'comparing' || stage === 'complete') && (
              <View style={styles.diceDisplayRow}>
                {defenderDice.map((val, i) => (
                  <View key={i} style={styles.diceItem}>
                    <Text style={styles.dieEmoji}>{getDieEmoji(val, 'red')}</Text>
                    <Text style={styles.dieValueText}>{val}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

          <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={styles.webView}
            scrollEnabled={false}
            bounces={false}
          />
        </View>

        {/* Always show results after animation */}
        {(stage === 'comparing' || stage === 'complete') && (
          <View style={styles.comparisons}>
            {comparisons.map((comp, i) => (
              <View key={i} style={styles.comparison}>
                <Text style={styles.comparisonText}>
                  <Text style={styles.attackerColor}>Die {i+1}: {comp.attacker}</Text>
                  {' vs '}
                  <Text style={styles.defenderColor}>Die {i+1}: {comp.defender}</Text>
                  {' → '}
                  <Text style={comp.winner === 'attacker' ? styles.attackerColor : styles.defenderColor}>
                    {comp.winner === 'attacker' ? attackerName : defenderName}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {(stage === 'comparing' || stage === 'complete') && outcome && (
          <View style={styles.outcomeContainer}>
            <Text style={[
              styles.outcomeText,
              outcome.includes('VICTORY') && styles.victoryText,
              outcome.includes('DEFEAT') && styles.defeatText,
              outcome.includes('STALEMATE') && styles.stalemateText,
            ]}>
              {outcome}
            </Text>
            
            {combatResults && (
              <View style={styles.resultsBox}>
                <Text style={styles.resultsTitle}>Combat Impact</Text>
                <View style={styles.resultsRow}>
                  <View style={styles.resultCol}>
                    <Text style={styles.resultLabel}>Your Losses</Text>
                    <Text style={[styles.resultValue, styles.lossText]}>-{combatResults.attackerLosses} Strength</Text>
                    <Text style={[styles.resultValue, combatResults.moraleChange >= 0 ? styles.gainText : styles.lossText]}>
                      {combatResults.moraleChange >= 0 ? '+' : ''}{combatResults.moraleChange} Morale
                    </Text>
                  </View>
                  <View style={styles.resultCol}>
                    <Text style={styles.resultLabel}>Enemy Losses</Text>
                    <Text style={[styles.resultValue, styles.gainText]}>-{combatResults.defenderLosses} Strength</Text>
                  </View>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                if (onComplete) onComplete();
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    colorLegendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    colorLegendCol: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
    },
    colorSwatch: {
      width: 14,
      height: 14,
      borderRadius: 3,
      marginRight: 4,
      borderWidth: 1,
      borderColor: '#fff',
    },
    colorLegendLabel: {
      fontSize: 11,
      color: '#f3f4f6',
      fontWeight: '700',
    },
  forcesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
  },
  forceBox: {
    flex: 1,
    alignItems: 'center',
  },
  forceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 2,
  },
  forceName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 4,
  },
  brigadesBox: {
    marginBottom: 4,
  },
  brigadeText: {
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
  },
  brigadeDetailText: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 2,
  },
  diceCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  versus: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ef4444',
    marginHorizontal: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  legendCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 4,
    textAlign: 'center',
  },
  legendText: {
    fontSize: 10,
    color: '#d1d5db',
    marginVertical: 1,
    textAlign: 'center',
  },
  diceDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  diceItem: {
    alignItems: 'center',
  },
  dieEmoji: {
    fontSize: 36,
    marginBottom: 2,
    color: '#ffffff',
  },
  dieValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#60a5fa',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 10,
  },
  webViewContainer: {
    height: 200,
    overflow: 'hidden',
    marginVertical: 4,
  },
  webView: {
    backgroundColor: 'transparent',
  },
  comparisons: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#111827',
    maxHeight: 80,
  },
  comparison: {
    marginVertical: 2,
  },
  comparisonText: {
    fontSize: 12,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  attackerColor: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  defenderColor: {
    color: '#ef4444',
    fontWeight: '700',
  },
  outcomeContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
    borderTopWidth: 2,
    borderTopColor: '#374151',
    alignItems: 'center',
  },
  outcomeText: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  victoryText: {
    color: '#10b981',
  },
  defeatText: {
    color: '#ef4444',
  },
  stalemateText: {
    color: '#f59e0b',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultsBox: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resultCol: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '700',
    marginVertical: 2,
  },
  lossText: {
    color: '#ef4444',
  },
  gainText: {
    color: '#10b981',
  },
});
