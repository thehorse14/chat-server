const express = require("express")
const router = express.Router()
const multer = require('multer');
const path = require('path');

// Configuration Constants
const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const DEFAULT_K = 10;
const SUPPORTED_FILE_EXTENSION = '.txt';

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    const ext = path.extname(file.originalname);
    if (ext !== SUPPORTED_FILE_EXTENSION) {
      req.fileFilterError = `Only ${SUPPORTED_FILE_EXTENSION} files are allowed`;
      callback(null, false);
    } else {
      callback(null, true);
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  }
});

router.post('/upload', upload.any(), (req, res) => {
    if (req.fileFilterError || (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: req.fileFilterError || 'No files uploaded.' });
    }
  
    try {
        const results = req.files.map(({ buffer, originalname }) => {
        const chatLogText = buffer.toString('utf8');
        const k = req.body.k || DEFAULT_K;
        const topUsers = processChatLog(chatLogText, k);
      
        return { fileName: originalname, topUsers };
      });
      res.json({ results });
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'An error occurred while processing the chat log.' });
    }
});

const processChatLog = (chatLogText, k) => {
  const lines = chatLogText.split('\n');
  const users = new Map();

  let currentUser = "";

  try {
    lines.forEach(line => {
      const match = /<([^>]+)>\s*(.+)/.exec(line);

      currentUser = match ? match[1] : currentUser;

      const message = match ? match[2] : line;
      const wordCount = countWords(message);

      if (currentUser !== "") {
        users.set(currentUser, (users.get(currentUser) || 0) + wordCount);
      }
    });

    const sortedUsers = [...users].sort((a, b) => b[1] - a[1]);

    const topK = sortedUsers.filter((user, index) => index < k || user[1] === sortedUsers[k - 1][1]);
    return topK.map(([userName, count]) => ({ userName, count }));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const countWords = (text) => {
  if (text.trim() === "") {
    return 0;
  }
  const words = text.trim().split(/\s+/);
  return words.filter(word => word !== '').length;
};
module.exports = router