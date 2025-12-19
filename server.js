const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Text-to-Image API endpoint using Hugging Face
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check for API key
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HF_API_KEY) {
      console.error('HUGGINGFACE_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API key not configured',
        message: 'Please add HUGGINGFACE_API_KEY to your environment variables'
      });
    }

    // Enhance prompt based on style
    let enhancedPrompt = prompt;
    switch(style) {
      case 'abstract':
        enhancedPrompt = `abstract art style, ${prompt}, colorful, artistic, modern art`;
        break;
      case 'geometric':
        enhancedPrompt = `geometric patterns, ${prompt}, modern, clean lines, minimalist`;
        break;
      case 'gradient':
        enhancedPrompt = `gradient art, ${prompt}, smooth colors, ethereal, dreamy`;
        break;
      case 'particle':
        enhancedPrompt = `particle effects, ${prompt}, glowing, digital art, sci-fi`;
        break;
      default:
        enhancedPrompt = `${prompt}, high quality, detailed`;
    }

    console.log('Generating image with prompt:', enhancedPrompt);

    // Call Hugging Face Inference API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          options: {
            wait_for_model: true
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      
      // Check if model is loading
      if (response.status === 503) {
        return res.status(503).json({
          error: 'Model is loading',
          message: 'The AI model is starting up. Please wait 20 seconds and try again.',
          retry: true
        });
      }
      
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log('Image generated successfully');
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      prompt: enhancedPrompt,
      source: 'huggingface'
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
    huggingface_configured: !!process.env.HUGGINGFACE_API_KEY
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to view your app`);
  console.log(`🤗 Hugging Face API: ${process.env.HUGGINGFACE_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});
