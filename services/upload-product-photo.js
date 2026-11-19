const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');

async function uploadProductPhoto(fileBuffer) {
    let imageBuffer;

    try {
        imageBuffer = await sharp(fileBuffer, {
                limitInputPixels: 25000000,
                failOn: 'warning'
            })
            .rotate()
            .resize({
                width: 1800,
                height: 1800,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toBuffer();
    } catch (error) {
        const imageError = new Error(
            'This image could not be processed. Choose a valid JPG, PNG or WebP photo.'
        );

        imageError.code = 'INVALID_IMAGE';
        throw imageError;
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
                folder: 'ke-malapi/products',
                resource_type: 'image'
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result || !result.secure_url || !result.public_id) {
                    return reject(new Error('Image upload did not complete'));
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        stream.on('error', reject);
        stream.end(imageBuffer);
    });
}

module.exports = uploadProductPhoto;