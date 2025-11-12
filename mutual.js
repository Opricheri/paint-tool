// HEX → RGBA
export function hexToRgba(hex, alpha = 1) {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    // 例: #abc → #aabbcc
    hex = hex.split('').map(x => x + x).join('');
  }

  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// RGBA → HEX
export function rgbaToHex(r, g, b, a = 1) {
  // 0〜1のaを0〜255に変換
  const alpha = Math.round(a * 255);
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16).padStart(2, '0');
        return hex;
      })
      .join('') +
    (alpha < 255 ? alpha.toString(16).padStart(2, '0') : '')
  );
}