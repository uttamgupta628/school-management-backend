const School = require('../model/school.model');
const { validateSchoolData } = require('../utils/validation');
const { uploadImageToCloudinary, deleteImageFromCloudinary, extractPublicIdFromUrl } = require('../utils/fileUtils');

const healthCheck = (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'School Management API is running',
    timestamp: new Date().toISOString()
  });
};

const getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: schools,
      count: schools.length
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schools',
      error: error.message
    });
  }
};

const getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching school',
      error: error.message
    });
  }
};

const addSchool = async (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  try {
    const { name, address, city, state, contact, email_id } = req.body;
    
    if (!name || !address || !city || !state || !contact || !email_id) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const validation = validateSchoolData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'School image is required'
      });
    }
    
    console.log('Uploading to Cloudinary...');
    const cloudinaryResult = await uploadImageToCloudinary(req.file.buffer, req.file.originalname);
    console.log('Cloudinary result:', cloudinaryResult);
    
    const school = new School({
      name,
      address,
      city,
      state,
      contact,
      image: cloudinaryResult.secure_url,
      email_id
    });
    
    await school.save();
    console.log('School saved successfully');
    
    res.status(201).json({
      success: true,
      message: 'School added successfully',
      data: {
        id: school._id,
        name,
        address,
        city,
        state,
        contact,
        email_id,
        image: cloudinaryResult.secure_url
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateSchool = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const { name, address, city, state, contact, email_id } = req.body;
    
    const validation = validateSchoolData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }
    
    const currentSchool = await School.findById(schoolId);
    
    if (!currentSchool) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    let imageUrl = currentSchool.image;
    
    if (req.file) {
      if (currentSchool.image) {
        const publicId = extractPublicIdFromUrl(currentSchool.image);
        await deleteImageFromCloudinary(publicId);
      }
      
      const cloudinaryResult = await uploadImageToCloudinary(req.file.buffer, req.file.originalname);
      imageUrl = cloudinaryResult.secure_url;
    }
    
    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      {
        name,
        address,
        city,
        state,
        contact,
        image: imageUrl,
        email_id
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'School updated successfully',
      data: {
        id: updatedSchool._id,
        name,
        address,
        city,
        state,
        contact,
        email_id,
        image: imageUrl
      }
    });
    
  } catch (error) {
    console.error('Error processing update request:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const deleteSchool = async (req, res) => {
  try {
    console.log('Full request params:', req.params);
    console.log('Full request URL:', req.url);
    console.log('Request method:', req.method);
    
    const schoolId = req.params.id;
    console.log('School ID to delete:', schoolId);
    
    if (!schoolId || schoolId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid school ID is required'
      });
    }
    
    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    if (school.image) {
      const publicId = extractPublicIdFromUrl(school.image);
      await deleteImageFromCloudinary(publicId);
    }
    
    await School.findByIdAndDelete(schoolId);
    
    res.json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting school',
      error: error.message
    });
  }
};

const searchSchools = async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const schools = await School.find({
      $or: [
        { name: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { address: searchRegex }
      ]
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: schools,
      count: schools.length
    });
  } catch (error) {
    console.error('Error searching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching schools',
      error: error.message
    });
  }
};

module.exports = {
  healthCheck,
  getAllSchools,
  getSchoolById,
  addSchool,
  updateSchool,
  deleteSchool,
  searchSchools
};