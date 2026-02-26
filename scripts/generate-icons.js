/**
 * Generate PWA icons for EscarGo!
 * Usage: node scripts/generate-icons.js
 * Requires: npm install canvas (dev dependency)
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZES = [192, 512];
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

function drawSnailIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size; // shorthand

  // Background - rounded green
  ctx.fillStyle = '#4a7c2e';
  ctx.beginPath();
  const r = s * 0.15;
  ctx.moveTo(r, 0);
  ctx.lineTo(s - r, 0);
  ctx.quadraticCurveTo(s, 0, s, r);
  ctx.lineTo(s, s - r);
  ctx.quadraticCurveTo(s, s, s - r, s);
  ctx.lineTo(r, s);
  ctx.quadraticCurveTo(0, s, 0, s - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Darker grass texture stripes
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = s * 0.01;
  for (let i = 0; i < 8; i++) {
    const y = s * 0.1 + i * s * 0.11;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y + s * 0.03);
    ctx.stroke();
  }

  const cx = s * 0.48;
  const cy = s * 0.52;
  const shellR = s * 0.28;

  // Shell shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.arc(cx + s * 0.01, cy + s * 0.03, shellR * 1.05, 0, Math.PI * 2);
  ctx.fill();

  // Shell - warm brown gradient
  const shellGrad = ctx.createRadialGradient(cx - shellR * 0.3, cy - shellR * 0.3, 0, cx, cy, shellR);
  shellGrad.addColorStop(0, '#c97b3a');
  shellGrad.addColorStop(0.6, '#8b5e34');
  shellGrad.addColorStop(1, '#6b4226');
  ctx.fillStyle = shellGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, shellR, 0, Math.PI * 2);
  ctx.fill();

  // Shell spiral
  ctx.strokeStyle = 'rgba(100,60,30,0.6)';
  ctx.lineWidth = s * 0.015;
  ctx.beginPath();
  for (let i = 0; i < 50; i++) {
    const t = i / 50;
    const angle = t * Math.PI * 3.5;
    const sr = t * shellR * 0.75;
    const sx = cx + Math.cos(angle) * sr;
    const sy = cy + Math.sin(angle) * sr;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Shell highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(cx - shellR * 0.3, cy - shellR * 0.3, shellR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headX = cx + shellR * 0.85;
  const headY = cy + shellR * 0.1;
  const headR = shellR * 0.55;

  ctx.fillStyle = '#7ec850';
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Eyes on stalks
  for (const side of [-1, 1]) {
    const eyeBaseX = headX + headR * 0.2;
    const eyeBaseY = headY + side * headR * 0.3;
    const eyeX = headX + headR * 0.65;
    const eyeY = headY + side * headR * 0.65;

    // Stalk
    ctx.strokeStyle = '#6ab840';
    ctx.lineWidth = s * 0.02;
    ctx.beginPath();
    ctx.moveTo(eyeBaseX, eyeBaseY);
    ctx.lineTo(eyeX, eyeY);
    ctx.stroke();

    // Eye white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, headR * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(eyeX + headR * 0.05, eyeY, headR * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smile
  ctx.strokeStyle = '#4a8030';
  ctx.lineWidth = s * 0.012;
  ctx.beginPath();
  ctx.arc(headX + headR * 0.15, headY, headR * 0.25, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Body (under shell, extending left)
  ctx.fillStyle = '#7ec850';
  ctx.beginPath();
  ctx.ellipse(cx - shellR * 0.4, cy + shellR * 0.6, shellR * 0.7, shellR * 0.2, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Speed lines (the comedic fast snail)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = s * 0.012;
  for (let i = 0; i < 3; i++) {
    const ly = cy - shellR * 0.5 + i * shellR * 0.5;
    const lx = cx - shellR * 1.3 - i * s * 0.03;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx - s * 0.12, ly);
    ctx.stroke();
  }

  return canvas.toBuffer('image/png');
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const buf = drawSnailIcon(size);
  const filename = `icon-${size}.png`;
  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  console.log(`Generated ${filename} (${buf.length} bytes)`);
}
