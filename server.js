const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Text-to-Image API endpoint using Prodia
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check for API key
    const PRODIA_API_KEY = process.env.PRODIA_API_KEY;
    if (!PRODIA_API_KEY) {
      console.error('PRODIA_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API key not configured',
        message: 'Please add PRODIA_API_KEY to your environment variables'
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

    // Step 1: Submit generation job to Prodia
    const generateResponse = await fetch(
      'https://api.prodia.com/v1/sd/generate',
      {
        method: 'POST',
        headers: {
          'X-Prodia-Key': PRODIA_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          model: "sdv1_4.ckpt [7460a6fa]",
          negative_prompt: "ugly, blurry, low quality, distorted, bad anatomy",
          steps: 20,
          cfg_scale: 7,
          seed: -1,
          upscale: false,
          sampler: "DPM++ 2M Karras"
        }),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Prodia generate error:', errorText);
      throw new Error(`Prodia API error: ${generateResponse.status} - ${errorText}`);
    }

    const { job } = await generateResponse.json();
    console.log('Job ID:', job);

    // Step 2: Poll for job completion
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(
        `https://api.prodia.com/v1/job/${job}`,
        {
          headers: {
            'X-Prodia-Key': PRODIA_API_KEY,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      console.log('Job status:', status.status);

      if (status.status === 'succeeded') {
        imageUrl = status.imageUrl;
      } else if (status.status === 'failed') {
        throw new Error('Image generation failed');
      }

      attempts++;
    }

    if (!imageUrl) {
      throw new Error('Image generation timed out');
    }

    // Step 3: Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const base64Url = `data:image/png;base64,${base64Image}`;

    console.log('Image generated successfully');
    
    res.json({ 
      success: true, 
      imageUrl: base64Url,
      prompt: enhancedPrompt,
      source: 'prodia'
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
    prodia_configured: !!process.env.PRODIA_API_KEY
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to view your app`);
  console.log(`🎨 Prodia API: ${process.env.PRODIA_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});
