const router = require('express').Router();
const multer = require('multer');  // Import multer library
const path = require('path');      // Import path
const File = require('../models/file');
const { v4: uuidv4 } = require('uuid');

// Configuration of multer
let storage = multer.diskStorage({
    // multer will understand that where it has to store file
    destination: (req, file, cb) => cb(null, 'uploads/') ,
    // for giving unique name to a files
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
              cb(null, uniqueName)
    } ,
});

let upload = multer({ storage, limits:{ fileSize: 1000000 * 100 }, }).single('myfile'); //100mb

router.post('/', (req, res) => {
    // Store files from Uploads folder
    upload(req, res, async (err) => {
        // Validate request
      if (err) {
        return res.status(500).send({ error: err.message });
      }

      // Store files from Uploads folder
        const file = new File({
            filename: req.file.filename,
            uuid: uuidv4(),
            path: req.file.path,
            size: req.file.size
        });

        // Response -> Link
        const response = await file.save();
        res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` });
        // http://localhost:3000/files/143423224r2r-3r2vssvvrgerbr   // In this way link will be generated to download shared file
      });
});

// Email
router.post('/send', async (req, res) => {
  const { uuid, emailTo, emailFrom, expiresIn } = req.body;     //emailTo should be correct & If emailFrom is incorrect then also ok BUT in future we can implement to verify emailFrom
  if(!uuid || !emailTo || !emailFrom) {
      return res.status(422).send({ error: 'All fields are required except expiry.'});
  }
  // Get data from db 
  try {
    const file = await File.findOne({ uuid: uuid });
    if(file.sender) {         // If file is send to that email once
      return res.status(422).send({ error: 'Email already sent once.'});
    }
    
    file.sender = emailFrom;    // If no file is send till now to that email
    file.receiver = emailTo;
    const response = await file.save();
    // send mail
    const sendMail = require('../services/mailService');
    sendMail({
      from: emailFrom,
      to: emailTo,
      subject: 'inShare file sharing',
      text: `${emailFrom} shared a file with you.`,
      html: require('../services/emailTemplate')({
                emailFrom, 
                downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email` ,
                size: parseInt(file.size/1000) + ' KB',
                expires: '24 hours'
            })
    }).then(() => {
      return res.send({success: true});
    }).catch(err => {
      return res.status(500).json({error: 'Error in email sending.'});
    });
} catch(err) {
  return res.status(500).send({ error: 'Something went wrong.'});
}

});

module.exports = router;