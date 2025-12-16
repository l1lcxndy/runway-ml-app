const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML file from 'public' folder

// Text-to-Image API endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Enhance prompt based on style
    let enhancedPrompt = prompt;
    switch(style) {
      case 'abstract':
        enhancedPrompt = `abstract art style, ${prompt}, colorful, artistic`;
        break;
      case 'geometric':
        enhancedPrompt = `geometric patterns, ${prompt}, modern, clean lines`;
        break;
      case 'gradient':
        enhancedPrompt = `gradient art, ${prompt}, smooth colors, ethereal`;
        break;
      case 'particle':
        enhancedPrompt = `particle effects, ${prompt}, glowing, digital art`;
        break;
      default:
        enhancedPrompt = prompt;
    }

    // Use Pollinations.ai API (free, no key required)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=800&height=600&nologo=true`;
    
    // Return the image URL
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      prompt: enhancedPrompt
    });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to view your app`);
});