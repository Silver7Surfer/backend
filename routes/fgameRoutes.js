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

router.get('/winners', (req, res) => {
  // Mock data for winners
  const winners = [
    {
        "platform": "Ultra Panda",
        "user_email": "m****0@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/UltraPanda_5_1.webp"
    },
    {
        "platform": "Milky Way",
        "user_email": "b****6@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/milkyway2023-01-18_125257.1599500000_1.webp"
    },
    {
        "platform": "TAI CHI Master",
        "user_email": "j****7@gmail.com",
        "amount": 600,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/TaiChiMaster.webp"
    },
    {
        "platform": "Vegas Sweeps",
        "user_email": "d****6@gmail.com",
        "amount": 500,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/VegasSweeps_4.png"
    },
    {
        "platform": "Ultra Panda",
        "user_email": "m****0@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/UltraPanda_5_1.webp"
    },
    {
        "platform": "Ultra Panda",
        "user_email": "g****c@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/UltraPanda_5_1.webp"
    },
    {
        "platform": "Game Vault",
        "user_email": "b****3@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/game-vault-logo-new_1.webp"
    },
    {
        "platform": "Lucky Fish",
        "user_email": "s****2@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/logo.png"
    },
    {
        "platform": "Golden Treasure",
        "user_email": "m****0@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/mages_golden_treasure-logo_1.webp"
    },
    {
        "platform": "Orion Stars",
        "user_email": "d****1@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/OrionStar_3_1.webp"
    },
    {
        "platform": "Orion Stars",
        "user_email": "d****3@gmail.com",
        "amount": 350,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/OrionStar_3_1.webp"
    },
    {
        "platform": "Gold Hunter",
        "user_email": "j****7@gmail.com",
        "amount": 600,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/gold_hunter-logo.webp"
    },
    {
        "platform": "Golden Treasure",
        "user_email": "m****0@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/mages_golden_treasure-logo_1.webp"
    },
    {
        "platform": "Juwa",
        "user_email": "g****c@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/Juwa_6_1.webp"
    },
    {
        "platform": "Gold Hunter",
        "user_email": "s****2@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/gold_hunter-logo.webp"
    },
    {
        "platform": "ICE7",
        "user_email": "a****z@gmail.com",
        "amount": 400,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/ice7-logo_YMeipHO.png"
    },
    {
        "platform": "Fire Kirin",
        "user_email": "z****3@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/FireKirin_6_1.webp"
    },
    {
        "platform": "Milky Way",
        "user_email": "b****6@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/milkyway2023-01-18_125257.1599500000_1.webp"
    },
    {
        "platform": "Gold Hunter",
        "user_email": "j****7@gmail.com",
        "amount": 600,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/gold_hunter-logo.webp"
    },
    {
        "platform": "Orion Stars",
        "user_email": "d****3@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/OrionStar_3_1.webp"
    },
    {
        "platform": "Fire Kirin",
        "user_email": "l****r@yahoo.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/FireKirin_6_1.webp"
    },
    {
        "platform": "Ultra Panda",
        "user_email": "j****0@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/UltraPanda_5_1.webp"
    },
    {
        "platform": "Ultra Panda",
        "user_email": "h****0@yahoo.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/UltraPanda_5_1.webp"
    },
    {
        "platform": "Cash Machine",
        "user_email": "s****2@gmail.com",
        "amount": 420,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/cashmachine.webp"
    },
    {
        "platform": "TAI CHI Master",
        "user_email": "j****7@gmail.com",
        "amount": 600,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/TaiChiMaster.webp"
    },
    {
        "platform": "TAI CHI Master",
        "user_email": "j****7@gmail.com",
        "amount": 600,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/TaiChiMaster.webp"
    },
    {
        "platform": "Lucky Stars",
        "user_email": "h****3@gmail.com",
        "amount": 500,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/image_13.png"
    },
    {
        "platform": "Vegas Sweeps",
        "user_email": "d****6@gmail.com",
        "amount": 350,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/VegasSweeps_4.png"
    },
    {
        "platform": "Ultra Panda",
        "user_email": "s****4@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/UltraPanda_5_1.webp"
    },
    {
        "platform": "Juwa",
        "user_email": "c****o@gmail.com",
        "amount": 300,
        "logo": "https://bitplay-new.ams3.digitaloceanspaces.com/PROD/uploads/Juwa_6_1.webp"
    }
];

  // Return the winners data
  return res.status(200).json(winners);
});

export default router;