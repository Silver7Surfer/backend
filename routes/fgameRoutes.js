// routes/fgameRoutes.js
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the hot games images
const hotGamesPath = path.join(__dirname, '../public/hot-games');
const platformsPath = path.join(__dirname, '../public/platforms');

/**
 * @route GET /api/games/hot
 * @desc Get list of hot games
 * @access Public
 */
router.get('/hot', (req, res) => {
    try {
      // Read the directory to get all available game images
      const files = fs.readdirSync(hotGamesPath);
      
      // Filter for webp and png files
      const gameImages = files.filter(file => 
        file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      );
      
      // Create a map to track the highest resolution image for each game ID
      const gameMap = new Map();
      
      // Process each image file
      gameImages.forEach(file => {
        // Extract ID from filename (assume filenames like "1.webp", "2.png", etc.)
        const filenameParts = file.split('.');
        const id = parseInt(filenameParts[0]);
        const extension = filenameParts[1].toLowerCase();
        
        // Skip if not a valid ID
        if (isNaN(id)) return;
        
        // If we haven't seen this ID before, or if webp has priority over existing format
        // (priority order: webp > png > jpg)
        if (!gameMap.has(id) || 
            (extension === 'webp') || 
            (extension === 'png' && gameMap.get(id).extension !== 'webp') ||
            (extension === 'jpg' && gameMap.get(id).extension !== 'webp' && gameMap.get(id).extension !== 'png')) {
          gameMap.set(id, {
            id,
            name: `Game ${id}`, // You can replace this with actual game names from a database
            imageUrl: `/hot-games/${file}`,
            extension
          });
        }
      });
      
      // Convert map to array and sort by ID
      const games = Array.from(gameMap.values());
      games.sort((a, b) => a.id - b.id);
      
      // Remove the extension property as it's not needed in the response
      games.forEach(game => delete game.extension);
      
      res.json({
        success: true,
        count: games.length,
        games
      });
    } catch (error) {
      console.error('Error fetching hot games:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hot games',
        error: error.message
      });
    }
  });

  router.get('/platforms', (req, res) => {
    try {
      // Read the directory to get all available game images
      const files = fs.readdirSync(platformsPath);
      
      // Filter for webp and png files
      const gameImages = files.filter(file => 
        file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      );
      
      // Create a map to track the highest resolution image for each game ID
      const gameMap = new Map();
      
      // Process each image file
      gameImages.forEach(file => {
        // Extract ID from filename (assume filenames like "1.webp", "2.png", etc.)
        const filenameParts = file.split('.');
        const id = parseInt(filenameParts[0]);
        const extension = filenameParts[1].toLowerCase();
        
        // Skip if not a valid ID
        if (isNaN(id)) return;
        
        // If we haven't seen this ID before, or if webp has priority over existing format
        // (priority order: webp > png > jpg)
        if (!gameMap.has(id) || 
            (extension === 'webp') || 
            (extension === 'png' && gameMap.get(id).extension !== 'webp') ||
            (extension === 'jpg' && gameMap.get(id).extension !== 'webp' && gameMap.get(id).extension !== 'png')) {
          gameMap.set(id, {
            id,
            name: `Game ${id}`, // You can replace this with actual game names from a database
            imageUrl: `/platforms/${file}`,
            extension
          });
        }
      });
      
      // Convert map to array and sort by ID
      const games = Array.from(gameMap.values());
      games.sort((a, b) => a.id - b.id);
      
      // Remove the extension property as it's not needed in the response
      games.forEach(game => delete game.extension);
      
      res.json({
        success: true,
        count: games.length,
        games
      });
    } catch (error) {
      console.error('Error fetching hot games:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hot games',
        error: error.message
      });
    }
});

/**
 * @route GET /api/games/details/:id
 * @desc Get details for a specific game
 * @access Public
 */
router.get('/details/:id', (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    
    // In a real app, you would fetch this data from a database
    // This is just a placeholder
    const gameDetails = {
      id: gameId,
      name: `Game ${gameId}`,
      description: `This is an exciting game with ID ${gameId}. Play now to win big!`,
      minBet: 0.10,
      maxBet: 100,
      category: ['slots', 'popular'],
      provider: 'GameWallet',
      releaseDate: '2023-01-01',
      imageUrl: `/hot-games/${gameId}.webp`,
    };
    
    res.json({
      success: true,
      game: gameDetails
    });
  } catch (error) {
    console.error(`Error fetching game details for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game details',
      error: error.message
    });
  }
});

export default router;