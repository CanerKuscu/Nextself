const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../assets/icon.png');
const outputPath = path.join(__dirname, '../assets/notification-icon.png');

async function createNotificationIcon() {
    try {
        await sharp(inputPath)
            .resize(96, 96)
            // Extract alpha channel
            .ensureAlpha()
            // Make all non-transparent pixels white
            .composite([{
                input: Buffer.from('<svg><rect width="96" height="96" fill="#ffffff" /></svg>'),
                blend: 'in'
            }])
            .png()
            .toFile(outputPath);
        console.log('Successfully created notification-icon.png');
    } catch (err) {
        console.error('Failed to create notification icon:', err);
    }
}

createNotificationIcon();
