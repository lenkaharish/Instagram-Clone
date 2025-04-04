const path = require('path');

const uploadImage = async (req, res) => {
    // #swagger.tags = ['image or video']

  /*
    #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['image'] = {
      in: 'formData',
      type: 'file',
      required: true,
      description: 'upload image or video',
    },
  */
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const imagePath = req.file.path.split(path.sep).join('/');

        return res.status(200).json({message: 'media uploaded successfully', mediaUrl:imagePath});
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { uploadImage };



