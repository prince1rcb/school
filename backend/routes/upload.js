const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png,gif,xlsx,xls,ppt,pptx')
    .split(',')
    .map(type => type.trim());
  
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

// @route   POST /api/upload/single
// @desc    Upload a single file
// @access  Private
router.post('/single', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const fileInfo = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
    uploadedAt: new Date()
  };

  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: { file: fileInfo }
  });
}));

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const filesInfo = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/${file.filename}`,
    uploadedBy: req.user._id,
    uploadedAt: new Date()
  }));

  res.json({
    success: true,
    message: `${req.files.length} files uploaded successfully`,
    data: { files: filesInfo }
  });
}));

// @route   POST /api/upload/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile-picture', upload.single('profilePicture'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No profile picture uploaded'
    });
  }

  // Check if file is an image
  if (!req.file.mimetype.startsWith('image/')) {
    // Remove uploaded file if it's not an image
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed for profile pictures'
    });
  }

  const User = require('../models/User');
  
  // Update user's profile picture
  const user = await User.findById(req.user._id);
  
  // Remove old profile picture if exists
  if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
    const oldFilePath = path.join(__dirname, '../', user.profilePicture);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
  }

  user.profilePicture = `/uploads/${req.file.filename}`;
  await user.save();

  res.json({
    success: true,
    message: 'Profile picture updated successfully',
    data: {
      profilePicture: user.profilePicture
    }
  });
}));

// @route   GET /api/upload/files/:filename
// @desc    Serve uploaded files
// @access  Private
router.get('/files/:filename', asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Security check - ensure file is within uploads directory
  const resolvedPath = path.resolve(filePath);
  const uploadsPath = path.resolve(path.join(__dirname, '../uploads'));
  
  if (!resolvedPath.startsWith(uploadsPath)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Set appropriate headers
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);

  // For non-images, set disposition to download
  if (!contentType.startsWith('image/')) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  res.sendFile(resolvedPath);
}));

// @route   DELETE /api/upload/files/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/files/:filename', asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  // Security check
  const resolvedPath = path.resolve(filePath);
  const uploadsPath = path.resolve(path.join(__dirname, '../uploads'));
  
  if (!resolvedPath.startsWith(uploadsPath)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // Only allow admin or file owner to delete
  // Note: In a production system, you'd want to track file ownership in the database
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only administrators can delete files'
    });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
}));

// @route   GET /api/upload/info
// @desc    Get upload configuration info
// @access  Private
router.get('/info', asyncHandler(async (req, res) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png,gif,xlsx,xls,ppt,pptx')
    .split(',')
    .map(type => type.trim());

  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

  res.json({
    success: true,
    data: {
      allowedFileTypes: allowedTypes,
      maxFileSize: maxFileSize,
      maxFileSizeMB: Math.round(maxFileSize / (1024 * 1024)),
      supportedMimeTypes: {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }
    }
  });
}));

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${Math.round(parseInt(process.env.MAX_FILE_SIZE || 5242880) / (1024 * 1024))}MB`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;