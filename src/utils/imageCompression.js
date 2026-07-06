// דוחס תמונה לפני העלאה — מונע גודל אחסון מיותר ושומר על מהירות המערכת
const MAX_PX = 800;
const QUALITY = 0.7;

export const compressImage = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', QUALITY));
    };
    img.src = dataUrl;
  });
