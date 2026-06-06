import { FONTS } from '@/lib/data';
import { EngravingEffect } from '@/lib/types';

export function loadImg(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function drawBase(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  w: number,
  h: number,
  emoji: string
): void {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#1c1c24');
  bg.addColorStop(0.4, '#23232e');
  bg.addColorStop(1, '#141418');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.sin(y / 8) * 0.008})`;
    ctx.fillRect(0, y, w, 1);
  }

  if (img) {
    const aspect = img.naturalWidth / img.naturalHeight;
    let dw = w * 0.8;
    let dh = dw / aspect;
    if (dh > h * 0.8) {
      dh = h * 0.8;
      dw = dh * aspect;
    }
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.save();
    ctx.globalAlpha = 0.92;
    try {
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch {}
    ctx.restore();
    const grd = ctx.createRadialGradient(w / 2, h * 0.85, 0, w / 2, h * 0.85, w * 0.35);
    grd.addColorStop(0, 'rgba(255,255,255,0.07)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.font = `${w * 0.28}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(emoji, w / 2, h / 2);
  }
}

export function drawEngraving(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontIdx: number,
  color: string,
  size: number,
  opacity: number,
  effect: EngravingEffect
): void {
  if (!text?.trim()) return;
  const f = FONTS[fontIdx];
  ctx.save();
  ctx.font = f.fn(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  switch (effect) {
    case 'laser': {
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 0.8;
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 0.15})`;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(text, x + 1.5, y + 1.5);
      const grad = ctx.createLinearGradient(x - tw / 2, y - size / 2, x + tw / 2, y + size / 2);
      grad.addColorStop(0, `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},${opacity})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${opacity})`);
      grad.addColorStop(0.7, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${opacity * 0.9})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},${opacity * 0.8})`);
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(${Math.min(255, r + 100)},${Math.min(255, g + 100)},${Math.min(255, b + 100)},0.3)`;
      ctx.fillText(text, x, y - size * 0.06);
      ctx.restore();
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity * 0.6})`;
      ctx.lineWidth = 0.8;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(x - tw / 2 - 8, y + size * 0.55);
      ctx.lineTo(x + tw / 2 + 8, y + size * 0.55);
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    }
    case 'emboss': {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillText(text, x + 3, y + 3);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillText(text, x + 1.5, y + 1.5);
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.fillText(text, x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(text, x - 1, y - 1);
      break;
    }
    case 'neon': {
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 1.5;
      ctx.fillStyle = `rgba(${r},${g},${b},0.3)`;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = size * 0.8;
      ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = size * 0.3;
      ctx.fillStyle = `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${opacity})`;
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 3;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(text, x, y);
      break;
    }
    case 'deboss': {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(text, x, y);
      ctx.fillStyle = `rgba(${Math.min(255, r + 100)},${Math.min(255, g + 100)},${Math.min(255, b + 100)},0.4)`;
      ctx.fillText(text, x, y + 2);
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillText(text, x, y - 1);
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 0.7})`;
      ctx.fillText(text, x, y);
      break;
    }
  }
  ctx.restore();
}
