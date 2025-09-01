const path = require('path');
const fs = require('fs');

const generateImageUrl = (req, imageName) => {
  if (!imageName) return null;
  
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}/schoolImages/${imageName}`;
};

const deleteSchoolImage = (imageName) => {
  if (!imageName) return;
  
  try {
    const imagePath = path.join(__dirname, '../schoolImages', imageName);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Deleted image: ${imageName}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

module.exports = {
  generateImageUrl,
  deleteSchoolImage
};