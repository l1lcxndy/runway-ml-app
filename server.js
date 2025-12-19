const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Text-to-Image API endpoint using DeepAI
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check for API key (get free one from deepai.org)
    const DEEPAI_API_KEY = process.env.DEEPAI_API_KEY || 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K';

    // Enhance prompt based on style
    let enhancedPrompt = prompt;
    switch(style) {
      case 'abstract':
        enhancedPrompt = `abstract art style, ${prompt}, colorful, artistic`;
        break;
      case 'geometric':
        enhancedPrompt = `geometric patterns, ${prompt}, modern, clean`;
        break;
      case 'gradient':
        enhancedPrompt = `gradient colors, ${prompt}, smooth, dreamy`;
        break;
      case 'particle':
        enhancedPrompt = `particle effects, ${prompt}, glowing, digital`;
        break;
      default:
        enhancedPrompt = prompt;
    }

    console.log('Generating image with prompt:', enhancedPrompt);

    // Create form data
    const formData = new URLSearchParams();
    formData.append('text', enhancedPrompt);

    // Call DeepAI API
    const response = await fetch('https://api.deepai.org/api/text2img', {
      method: 'POST',
      headers: {
        'api-key': DEEPAI_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepAI API error:', errorText);
      throw new Error(`DeepAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.output_url) {
      console.log('Image generated successfully:', data.output_url);
      
      // Fetch the image and convert to base64
      const imageResponse = await fetch(data.output_url);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const base64Url = `data:image/jpeg;base64,${base64Image}`;

      res.json({ 
        success: true, 
        imageUrl: base64Url,
        directUrl: data.output_url,
        prompt: enhancedPrompt,
        source: 'deepai'
      });
    } else {
      throw new Error('No image URL in response');
    }

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
    api: 'DeepAI (Free)',
    api_key_configured: !!process.env.DEEPAI_API_KEY
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to view your app`);
  console.log(`🎨 Using DeepAI API`);
});
