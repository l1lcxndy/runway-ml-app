const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Text-to-Image API endpoint using Pollinations.ai (improved)
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Enhance prompt based on style
    let enhancedPrompt = prompt;
    let model = 'flux'; // Default to FLUX model (best quality)
    
    switch(style) {
      case 'abstract':
        enhancedPrompt = `abstract art, ${prompt}, colorful, artistic, vibrant colors, modern art`;
        break;
      case 'geometric':
        enhancedPrompt = `geometric patterns, ${prompt}, clean lines, minimalist design, vector art`;
        break;
      case 'gradient':
        enhancedPrompt = `gradient background, ${prompt}, smooth colors, dreamy atmosphere, soft lighting`;
        break;
      case 'particle':
        enhancedPrompt = `particle effects, ${prompt}, glowing particles, sci-fi digital art, neon`;
        break;
      default:
        enhancedPrompt = `${prompt}, high quality, detailed, professional`;
    }

    console.log('Generating image with prompt:', enhancedPrompt);

    // Use Pollinations.ai API with improved parameters
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=768&model=${model}&nologo=true&enhance=true`;
    
    // Fetch the image to ensure it's generated
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to generate image: ${imageResponse.status}`);
    }

    // Get image as buffer and convert to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const base64Url = `data:image/jpeg;base64,${base64Image}`;

    console.log('Image generated successfully');
    
    res.json({ 
      success: true, 
      imageUrl: base64Url,
      prompt: enhancedPrompt,
      source: 'pollinations.ai',
      directUrl: imageUrl
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
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    api: 'Pollinations.ai (Free, No API Key Required)'
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to view your app`);
  console.log(`🎨 Using Pollinations.ai API (Free & Unlimited)`);
});
