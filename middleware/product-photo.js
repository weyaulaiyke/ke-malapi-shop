const multer = require('multer');

const allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 8 * 1024 * 1024,
        files: 1,
        fields: 20,
        fieldSize: 8192
    },

    fileFilter: (req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            const error = new Error(
                'Please upload a JPG, PNG or WebP image'
            );

            error.code = 'INVALID_IMAGE_TYPE';
            return callback(error);
        }

        callback(null, true);
    }
}).single('photo');

function productPhoto(req, res, next) {
    upload(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Your photo must be 8 MB or smaller'
                });
            }

            if (error.code === 'INVALID_IMAGE_TYPE') {
                return res.status(400).json({
                    error: error.message
                });
            }

            return res.status(400).json({
                error: 'Unable to accept this upload. Choose one photo up to 8 MB.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'Please choose a product photo'
            });
        }

        next();
    });
}

module.exports = productPhoto;