export const processImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
  
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 500; // Max width for resizing
          const maxHeight = 500; // Max height for resizing
          let width = img.width;
          let height = img.height;
  
          // Resize the image to fit within maxWidth and maxHeight
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
  
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
  
          // Convert the canvas image to a base64 URL
          const base64 = canvas.toDataURL("image/jpeg", 0.8); // 0.8 = 80% quality
          resolve(base64);
        };
  
        img.onerror = (error) => {
          reject(error);
        };
      };
  
      reader.onerror = (error) => {
        reject(error);
      };
  
      reader.readAsDataURL(file);
    });
  };