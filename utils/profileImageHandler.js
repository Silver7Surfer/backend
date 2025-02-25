import fs from 'fs/promises';
import path from 'path';

export const getRandomProfileImage = async () => {
    try {
        const number = Math.floor(Math.random() * 18) + 1;
        const imagePath = path.join(process.cwd(), 'public', 'profile-icons', `${number}.png`);
        const imageBuffer = await fs.readFile(imagePath);
        return {
            buffer: imageBuffer,
            type: 'image/png'
        };
    } catch (error) {
        console.error('Error loading profile image:', error);
        throw error;
    }
};