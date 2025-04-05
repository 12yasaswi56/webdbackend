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
        console.log('Rejected file type:', file.mimetype);
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
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
    const uploadedFiles = req.files.map(file => {
      // Determine the type based on mime type
      let type;
      if (file.mimetype.startsWith('image/')) {
        type = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        type = 'video';
      } else if (file.mimetype.startsWith('audio/')) {
        type = 'audio';
      } else {
        type = 'document'; // This will catch PDFs and other documents
      }

      return {
        type,
        url: `/uploads/${file.filename}`,
        filename: file.originalname,
        size: file.size
      };
    });

    res.status(200).json({ files: uploadedFiles });
  } catch (err) {
    console.error('Error uploading files:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;