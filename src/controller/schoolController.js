const { db } = require('../config/database');
const { validateSchoolData } = require('../utils/validation');
const { deleteSchoolImage, generateImageUrl } = require('../utils/fileUtils');
const fs = require('fs');

// Health check
const healthCheck = (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'School Management API is running',
    timestamp: new Date().toISOString()
  });
};

// Get all schools
const getAllSchools = (req, res) => {
  const query = 'SELECT * FROM schools ORDER BY created_at DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching schools:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching schools',
        error: err.message
      });
    }
    
    const schoolsWithImageUrls = results.map(school => ({
      ...school,
      image: generateImageUrl(req, school.image)
    }));
    
    res.json({
      success: true,
      data: schoolsWithImageUrls,
      count: results.length
    });
  });
};

// Get single school by ID
const getSchoolById = (req, res) => {
  const schoolId = req.params.id;
  const query = 'SELECT * FROM schools WHERE id = ?';
  
  db.query(query, [schoolId], (err, results) => {
    if (err) {
      console.error('Error fetching school:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching school',
        error: err.message
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    const school = results[0];
    school.image = generateImageUrl(req, school.image);
    
    res.json({
      success: true,
      data: school
    });
  });
};

// Add new school
const addSchool = (req, res) => {
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
    
    const query = `
      INSERT INTO schools (name, address, city, state, contact, image, email_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [name, address, city, state, contact, imageName, email_id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteErr) {
            console.error('Error deleting file:', deleteErr);
          }
        }
        
        return res.status(500).json({
          success: false,
          message: 'Error adding school to database',
          error: err.message
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'School added successfully',
        data: {
          id: result.insertId,
          name,
          address,
          city,
          state,
          contact,
          email_id,
          image: generateImageUrl(req, imageName)
        }
      });
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
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update school
const updateSchool = (req, res) => {
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
    
    db.query('SELECT * FROM schools WHERE id = ?', [schoolId], (err, results) => {
      if (err) {
        console.error('Error fetching school for update:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({
          success: false,
          message: 'Error fetching school data'
        });
      }
      
      if (results.length === 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'School not found'
        });
      }
      
      const currentSchool = results[0];
      let imageName = currentSchool.image;
      
      if (req.file) {
        if (currentSchool.image) {
          deleteSchoolImage(currentSchool.image);
        }
        imageName = req.file.filename;
      }
      
      const query = `
        UPDATE schools 
        SET name = ?, address = ?, city = ?, state = ?, contact = ?, image = ?, email_id = ?
        WHERE id = ?
      `;
      
      db.query(query, [name, address, city, state, contact, imageName, email_id, schoolId], (err, result) => {
        if (err) {
          console.error('Error updating school:', err);
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(500).json({
            success: false,
            message: 'Error updating school'
          });
        }
        
        res.json({
          success: true,
          message: 'School updated successfully',
          data: {
            id: schoolId,
            name,
            address,
            city,
            state,
            contact,
            email_id,
            image: generateImageUrl(req, imageName)
          }
        });
      });
    });
    
  } catch (error) {
    console.error('Error processing update request:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete school
const deleteSchool = (req, res) => {
  const schoolId = req.params.id;
  
  db.query('SELECT image FROM schools WHERE id = ?', [schoolId], (err, results) => {
    if (err) {
      console.error('Error fetching school for deletion:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching school data'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    const school = results[0];
    
    db.query('DELETE FROM schools WHERE id = ?', [schoolId], (err, result) => {
      if (err) {
        console.error('Error deleting school:', err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting school'
        });
      }
      deleteSchoolImage(school.image);
      
      res.json({
        success: true,
        message: 'School deleted successfully'
      });
    });
  });
};

// Search schools
const searchSchools = (req, res) => {
  const searchTerm = `%${req.params.term}%`;
  const query = `
    SELECT * FROM schools 
    WHERE name LIKE ? OR city LIKE ? OR state LIKE ? OR address LIKE ?
    ORDER BY created_at DESC
  `;
  
  db.query(query, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error('Error searching schools:', err);
      return res.status(500).json({
        success: false,
        message: 'Error searching schools'
      });
    }
    
    const schoolsWithImageUrls = results.map(school => ({
      ...school,
      image: generateImageUrl(req, school.image)
    }));
    
    res.json({
      success: true,
      data: schoolsWithImageUrls,
      count: results.length
    });
  });
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