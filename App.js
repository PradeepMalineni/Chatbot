// src/App.js

import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [query, setQuery] = useState('');
  const [pdfFiles, setPdfFiles] = useState([]);
  const [embeddedResponses, setEmbeddedResponses] = useState([]);

  const handleQuerySubmit = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/chat', { query });
      setEmbeddedResponses([response.data.openAI]); // Ensure it's an array
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handlePdfUpload = async (e) => {
    const files = e.target.files;
    setPdfFiles(files);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('pdfs', file);
      }

      const response = await axios.post('http://localhost:3001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const embeddedResponses = response.data.embeddedResponses;

      // Check if embeddedResponses is an array before using map
      if (Array.isArray(embeddedResponses)) {
        // Now you can safely use map on embeddedResponses
        const mappedResponses = embeddedResponses.map(response => response.trim());
        setEmbeddedResponses(mappedResponses);
      } else {
        console.error('Invalid response structure from the server:', response.data);
      }

      console.log('PDFs uploaded and embedded successfully');
    } catch (error) {
      console.error('Error uploading PDFs:', error);
    }
  };

  return (
    <div>
      <div>
        <h2>User Input</h2>
        <div>
          <input
            type="text"
            placeholder="Enter your query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleQuerySubmit}>Submit</button>
        </div>
      </div>
      <div>
        <h2>PDF Upload</h2>
        <div>
          <input type="file" accept=".pdf" multiple onChange={handlePdfUpload} />
        </div>
      </div>
      <div>
        <h2>Embedded Responses:</h2>
        <ul>
          {embeddedResponses.map((response, index) => (
            <li key={index}>{response}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
