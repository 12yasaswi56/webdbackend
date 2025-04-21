const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
   // In uploads.js, modify the destination configuration
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 }); // Give full permissions
}
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',   // MP3
  'audio/wav',    // WAV
  'audio/ogg',    // OGG
  'audio/webm',   // WebM audio
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type: ${file.mimetype}. Only ${allowedTypes.join(', ')} are allowed.`);
      error.status = 400;
      cb(error, false);
    }
  };

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload endpoint
// Upload endpoint
// Upload endpoint
// router.post('/', upload.array('files', 10), async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: 'No files uploaded' });
//     }

//     const uploadedFiles = req.files.map(file => ({
//       type: file.mimetype.split('/')[0],
//       url: `/uploads/${file.filename}`,
//       filename: file.originalname,
//       size: file.size
//     }));

//     res.status(200).json({ files: uploadedFiles });
//   } catch (err) {
//     console.error('Error uploading files:', err);
//     res.status(500).json({ error: 'File upload failed' });
//   }
// });
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
 // Log each file's details
 req.files.forEach(file => {
  console.log(`Saved file: ${file.filename}, Path: ${file.path}, Size: ${file.size}`);
  if (!fs.existsSync(file.path)) {
    console.error(`File not actually saved: ${file.path}`);
  }
});
 // Verify files were actually written to disk
 const fileVerification = req.files.map(file => {
  try {
    const exists = fs.existsSync(file.path);
    if (!exists) {
      throw new Error(`File was not saved: ${file.path}`);
    }
    return true;
  } catch (err) {
    console.error('File verification error:', err);
    return false;
  }
});

if (fileVerification.includes(false)) {
  return res.status(500).json({ 
    error: 'Some files failed to save properly. Please try again.' 
  });
}
    // Process uploaded files with proper type detection
    const uploadedFiles = req.files.map(file => {
      // Determine file type based on mime type
      let type;
      const [mainType] = file.mimetype.split('/');
      
      switch(mainType) {
        case 'image':
        case 'video':
        case 'audio':
          type = mainType;
          break;
        default:
          type = 'document';
      }

      return {
        type,
        url: `/uploads/${file.filename}`,
        filename: file.originalname,
        size: file.size
      };
    });

  // Log successful upload
  console.log('Successfully uploaded files:', 
    uploadedFiles.map(f => `${f.filename} (${f.type})`));

  res.status(200).json({ 
    success: true,
    files: uploadedFiles 
  });

} catch (err) {
  console.error('File upload error:', err);
  
  // Clean up any partially uploaded files on error
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        console.error('Error cleaning up file:', cleanupErr);
      }
    });
  }

  const status = err.status || 500;
  const message = err.message || 'File upload failed. Please try again.';
  
  res.status(status).json({ 
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
});

module.exports = router;