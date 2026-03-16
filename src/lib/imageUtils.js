export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function autoOrientImage(ctx, canvas, image) {
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.drawImage(image, 0, 0, width, height);
  
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    let rTotal = 0, gTotal = 0, bTotal = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      rTotal += data[i];
      gTotal += data[i + 1];
      bTotal += data[i + 2];
      pixelCount++;
    }
    
    const avgR = rTotal / pixelCount;
    const avgG = gTotal / pixelCount;
    const avgB = bTotal / pixelCount;
    const avgBrightness = (avgR + avgG + avgB) / 3;
    
    if (avgBrightness < 80) {
      const factor = 110 / avgBrightness;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * factor);
        data[i + 1] = Math.min(255, data[i + 1] * factor);
        data[i + 2] = Math.min(255, data[i + 2] * factor);
      }
      ctx.putImageData(imgData, 0, 0);
    }
    
    const grayValues = [];
    for (let i = 0; i < data.length; i += 4) {
      grayValues.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    grayValues.sort((a, b) => a - b);
    const medianGray = grayValues[Math.floor(grayValues.length / 2)];
    
    if (medianGray < 60) {
      const contrastFactor = 1.15;
      const intercept = 128 * (1 - contrastFactor);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] * contrastFactor + intercept));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrastFactor + intercept));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrastFactor + intercept));
      }
      ctx.putImageData(imgData, 0, 0);
    }
  } catch (e) {
    console.warn('Image enhancement skipped:', e.message);
  }
  
  return canvas;
}

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  
  // Usar las dimensiones reales del recorte, no forzar a 1000px
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Dimensiones reales del área recortada
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Dibujar solo el área recortada (sin escalar a 1000px)
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  autoOrientImage(ctx, canvas, image);

  return canvas.toDataURL('image/jpeg', 0.95);
}

export function downloadBase64Image(base64Data, filename) {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
