export const validateCameraAngle = (angle: string) => {
    const validAngles = [
      'extreme close-up', 'close-up', 'medium', 'long', 
      'wide', 'overhead', 'low-angle', 'dutch'
    ];
    return validAngles.includes(angle.toLowerCase()) ? angle : 'medium';
  };