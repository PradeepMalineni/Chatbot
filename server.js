// server.js

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const pdf = require('pdf-parse');

const app = express();
const port = 3001;

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}${ext}`);
    },
  }),
});

app.use(cors());
app.use(bodyParser.json());

app.post('/api/chat', (req, res) => {
  const query = req.body.query;
  res.json({ openAI: `Response from server for user query: ${query}` });
});

app.post('/api/upload', upload.array('pdfs', 5), async (req, res) => {
  try {
    const pdfFiles = req.files;
    const pdfTextContents = [];

    for (const file of pdfFiles) {
      const pdfFilePath = file.path;
      const textContent = await extractTextFromPDF(pdfFilePath);
      pdfTextContents.push(textContent);
    }

    const embedPromises = pdfTextContents.map(textContent => embedTextWithOpenAI(textContent));
    const embeddedResponses = await Promise.all(embedPromises);

    res.json({ message: 'PDFs uploaded and embedded successfully', embeddedResponses });
  } catch (error) {
    console.error('Error handling PDF upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function extractTextFromPDF(pdfFilePath) {
  try {
    const dataBuffer = require('fs').readFileSync(pdfFilePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

async function embedTextWithOpenAI(textContent) {
  const openAIEndpoint = 'https://api.openai.com/v1/engines/davinci/completions';
  const openAIKey = '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'; // Replace with your actual OpenAI API key

  try {
    const response = await axios.post(openAIEndpoint, {
      prompt: textContent,
      max_tokens: 100,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error making request to OpenAI:', error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
