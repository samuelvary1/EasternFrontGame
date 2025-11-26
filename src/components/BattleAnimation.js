// BattleAnimation component - animated battle visualization

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function BattleAnimation({ 
  visible, 
  attackerName = 'Attacker',
  defenderName = 'Defender',
  attackerType = 'mechanized',
  attackerPower = 100,
  defenderPower = 100,
  onComplete 
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
      background: linear-gradient(to bottom, #87ceeb 0%, #d4a574 70%, #8b7355 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #canvas { 
      display: block; 
      width: 100vw; 
      height: 100vh;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const attackerPower = ${attackerPower};
    const defenderPower = ${defenderPower};
    const attackerType = '${attackerType}';
    
    // Particle system for explosions
    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2;
        this.life = 1.0;
        this.color = color;
        this.size = Math.random() * 4 + 2;
      }
      
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // gravity
        this.life -= 0.02;
      }
      
      draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
      }
    }
    
    // Soldier unit
    class Soldier {
      constructor(x, y, isAttacker) {
        this.x = x;
        this.y = y;
        this.isAttacker = isAttacker;
        this.speed = isAttacker ? 1.5 : 0;
        this.health = 100;
        this.shooting = false;
        this.shootTimer = 0;
        this.size = 12;
      }
      
      update() {
        if (this.isAttacker && this.health > 0) {
          this.x += this.speed;
        }
        
        this.shootTimer++;
        if (this.shootTimer > 30) {
          this.shooting = true;
          this.shootTimer = 0;
        }
      }
      
      draw() {
        if (this.health <= 0) return;
        
        // Body
        ctx.fillStyle = this.isAttacker ? '#1e40af' : '#991b1b';
        ctx.fillRect(this.x - 4, this.y - 8, 8, 12);
        
        // Head
        ctx.fillStyle = this.isAttacker ? '#3b82f6' : '#dc2626';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Weapon
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + (this.isAttacker ? 4 : -4), this.y - 4);
        ctx.lineTo(this.x + (this.isAttacker ? 10 : -10), this.y - 4);
        ctx.stroke();
        
        // Muzzle flash
        if (this.shooting) {
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(this.x + (this.isAttacker ? 10 : -10), this.y - 5, 6, 2);
          this.shooting = false;
        }
      }
    }
    
    // Tank unit
    class Tank {
      constructor(x, y, isAttacker) {
        this.x = x;
        this.y = y;
        this.isAttacker = isAttacker;
        this.speed = isAttacker ? 0.8 : 0;
        this.health = 100;
        this.shootTimer = 0;
        this.size = 20;
      }
      
      update() {
        if (this.isAttacker && this.health > 0) {
          this.x += this.speed;
        }
        
        this.shootTimer++;
        if (this.shootTimer > 60) {
          this.shoot();
          this.shootTimer = 0;
        }
      }
      
      shoot() {
        explosions.push({
          x: this.x + (this.isAttacker ? 200 : -200),
          y: this.y - 10,
          timer: 0
        });
      }
      
      draw() {
        if (this.health <= 0) return;
        
        ctx.fillStyle = this.isAttacker ? '#1e40af' : '#7f1d1d';
        
        // Hull
        ctx.fillRect(this.x - 15, this.y - 8, 30, 16);
        
        // Turret
        ctx.fillRect(this.x - 10, this.y - 16, 20, 10);
        
        // Barrel
        ctx.fillRect(this.x + (this.isAttacker ? 10 : -20), this.y - 13, this.isAttacker ? 15 : 15, 4);
        
        // Tracks
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 15, this.y + 8, 30, 4);
      }
    }
    
    // Initialize units
    const attackerUnits = [];
    const defenderUnits = [];
    const particles = [];
    const explosions = [];
    
    // Create attacker units
    const attackerCount = Math.floor(attackerPower / 10);
    for (let i = 0; i < Math.min(attackerCount, 15); i++) {
      if (attackerType.includes('armor') || attackerType.includes('tank')) {
        attackerUnits.push(new Tank(50 + i * 30, canvas.height - 100 - Math.random() * 40, true));
      } else {
        attackerUnits.push(new Soldier(50 + i * 25, canvas.height - 80 - Math.random() * 30, true));
      }
    }
    
    // Create defender units
    const defenderCount = Math.floor(defenderPower / 10);
    for (let i = 0; i < Math.min(defenderCount, 12); i++) {
      defenderUnits.push(new Soldier(canvas.width - 100 - i * 30, canvas.height - 80 - Math.random() * 30, false));
    }
    
    // Animation loop
    let frame = 0;
    function animate() {
      frame++;
      
      // Sky and ground
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87ceeb');
      gradient.addColorStop(0.6, '#d4a574');
      gradient.addColorStop(1, '#8b7355');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Smoke/dust in background
      ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
      for (let i = 0; i < 5; i++) {
        const x = (frame * 0.5 + i * 200) % canvas.width;
        ctx.fillRect(x, canvas.height - 150, 100, 60);
      }
      
      // Random explosions
      if (Math.random() < 0.03 && frame > 30) {
        explosions.push({
          x: canvas.width * 0.3 + Math.random() * canvas.width * 0.4,
          y: canvas.height - 100 - Math.random() * 50,
          timer: 0
        });
      }
      
      // Update and draw explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.timer++;
        
        // Create particles
        if (exp.timer === 1) {
          for (let j = 0; j < 30; j++) {
            particles.push(new Particle(exp.x, exp.y, 
              Math.random() > 0.5 ? '#ff6600' : '#ffaa00'));
          }
        }
        
        // Draw explosion flash
        if (exp.timer < 10) {
          ctx.fillStyle = \`rgba(255, 200, 0, \${1 - exp.timer / 10})\`;
          ctx.beginPath();
          ctx.arc(exp.x, exp.y, 20 + exp.timer * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (exp.timer > 30) {
          explosions.splice(i, 1);
        }
      }
      
      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
        }
      }
      
      // Update and draw units
      attackerUnits.forEach(unit => {
        unit.update();
        unit.draw();
      });
      
      defenderUnits.forEach(unit => {
        unit.update();
        unit.draw();
      });
      
      // Combat effects between units
      if (frame % 20 === 0) {
        attackerUnits.forEach(attacker => {
          defenderUnits.forEach(defender => {
            if (Math.abs(attacker.x - defender.x) < 150 && Math.random() < 0.3) {
              // Tracer fire
              ctx.strokeStyle = '#ffff00';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(attacker.x, attacker.y - 4);
              ctx.lineTo(defender.x, defender.y - 4);
              ctx.stroke();
            }
          });
        });
      }
      
      // End after 4 seconds
      if (frame > 240) {
        window.ReactNativeWebView?.postMessage('complete');
        return;
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
  </script>
</body>
</html>
  `;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'complete' && onComplete) {
            onComplete();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
