const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Text-to-Image API endpoint using Segmind
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check for API key
    const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
    if (!SEGMIND_API_KEY) {
      console.error('SEGMIND_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API key not configured',
        message: 'Please add SEGMIND_API_KEY to your environment variables'
      });
    }

    // Enhance prompt based on style
    let enhancedPrompt = prompt;
    switch(style) {
      case 'abstract':
        enhancedPrompt = `abstract art, ${prompt}, colorful, artistic, vibrant`;
        break;
      case 'geometric':
        enhancedPrompt = `geometric patterns, ${prompt}, clean lines, minimalist`;
        break;
      case 'gradient':
        enhancedPrompt = `gradient art, ${prompt}, smooth colors, dreamy`;
        break;
      case 'particle':
        enhancedPrompt = `particle effects, ${prompt}, glowing, digital art`;
        break;
      default:
        enhancedPrompt = `${prompt}, high quality, detailed`;
    }

    console.log('Generating image with prompt:', enhancedPrompt);

    // Call Segmind API (Stable Diffusion XL)
    const response = await fetch(
      'https://api.segmind.com/v1/sdxl1.0-txt2img',
      {
        method: 'POST',
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          negative_prompt: "ugly, blurry, low quality, distorted",
          samples: 1,
          scheduler: "UniPC",
          num_inference_steps: 20,
          guidance_scale: 8,
          seed: Math.floor(Math.random() * 1000000),
          img_width: 1024,
          img_height: 768,
          base64: false
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Segmind API error:', errorText);
      throw new Error(`Segmind API error: ${response.status} - ${errorText}`);
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log('Image generated successfully');
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      prompt: enhancedPrompt,
      source: 'segmind'
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
    segmind_configured: !!process.env.SEGMIND_API_KEY
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to view your app`);
  console.log(`🎨 Segmind API: ${process.env.SEGMIND_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});
