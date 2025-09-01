const School = require('../model/school.model');
const { validateSchoolData } = require('../utils/validation');
const { deleteSchoolImage, generateImageUrl } = require('../utils/fileUtils');
const fs = require('fs');

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
    
    const schoolsWithImageUrls = schools.map(school => ({
      ...school.toObject(),
      image: generateImageUrl(req, school.image)
    }));
    
    res.json({
      success: true,
      data: schoolsWithImageUrls,
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
    
    const schoolData = school.toObject();
    schoolData.image = generateImageUrl(req, school.image);
    
    res.json({
      success: true,
      data: schoolData
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
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const validation = validateSchoolData(req.body);
    if (!validation.isValid) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
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
    
    const imageName = req.file.filename;
    
    const school = new School({
      name,
      address,
      city,
      state,
      contact,
      image: imageName,
      email_id
    });
    
    await school.save();
    
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
        image: generateImageUrl(req, imageName)
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteErr) {
        console.error('Error deleting file:', deleteErr);
      }
    }
    
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
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }
    
    const currentSchool = await School.findById(schoolId);
    
    if (!currentSchool) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    let imageName = currentSchool.image;
    
    if (req.file) {
      if (currentSchool.image) {
        deleteSchoolImage(currentSchool.image);
      }
      imageName = req.file.filename;
    }
    
    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      {
        name,
        address,
        city,
        state,
        contact,
        image: imageName,
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
        image: generateImageUrl(req, imageName)
      }
    });
    
  } catch (error) {
    console.error('Error processing update request:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    
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
    const school = await School.findById(req.params.id);
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    await School.findByIdAndDelete(req.params.id);
    deleteSchoolImage(school.image);
    
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
    
    const schoolsWithImageUrls = schools.map(school => ({
      ...school.toObject(),
      image: generateImageUrl(req, school.image)
    }));
    
    res.json({
      success: true,
      data: schoolsWithImageUrls,
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