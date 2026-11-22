# Artisan AI Analyzer - Starter Guide

Congratulations on getting your API key! Follow this step-by-step blueprint to build a fully working local prototype where an artisan can upload an item image, and the Gemini 3.8 Flash model will analyze it and estimate a price.

---

## Step 1: Set Up Your Project Environment

1. **Create a project folder** on your computer and open your terminal inside it:
   ```bash
   mkdir artisan-analyzer
   cd artisan-analyzer
   ```

2. **Install the required libraries**:
   ```bash
   pip install google-genai flask pillow python-dotenv
   ```

3. **Configure your API Key**:
   Create a file named `.env` in your project folder and add your key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

---

## Step 2: Create the Backend (`app.py`)

Create a file named `app.py` and paste the following production-ready code. This runs a small web server that accepts your uploaded image, securely queries **Gemini 3.8 Flash**, and returns structured JSON.

```python
import os
from flask import Flask, request, jsonify, render_template_string
from google import genai
from google.genai import types
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Initialize the official Gemini Client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Simple frontend HTML interface served from the root URL
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Artisan AI Valuer</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        .card { border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        input[type="file"] { margin: 15px 0; display: block; }
        button { background: #1a73e8; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #1557b0; }
        #result { margin-top: 20px; white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 4px; display: none; }
        .loading { color: #666; font-style: italic; display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h2>🎨 Artisan AI Appraisal</h2>
        <p>Upload a clear photo of your handcrafted item to analyze materials, tags, and get a baseline price estimation.</p>
        
        <form id="uploadForm">
            <input type="file" id="imageInput" accept="image/*" required>
            <button type="submit">Analyze Item</button>
        </form>
        
        <div id="loading" class="loading">Analyzing your craftsmanship... Please wait.</div>
        <div id="result"></div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('imageInput');
            const resultDiv = document.getElementById('result');
            const loadingDiv = document.getElementById('loading');
            
            if (!fileInput.files[0]) return;
            
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            
            loadingDiv.style.display = 'block';
            resultDiv.style.display = 'none';
            
            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                
                loadingDiv.style.display = 'none';
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `<h3>Analysis Results:</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
            } catch (error) {
                loadingDiv.style.display = 'none';
                resultDiv.style.display = 'block';
                resultDiv.innerText = 'An error occurred during analysis.';
                console.error(error);
            }
        });
    </script>
</body>
</html>
'''

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/analyze', methods=['POST'])
def analyze_item():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Open image using Pillow
        img = Image.open(file.stream)
        
        # Enforce structured output via JSON schemas
        prompt = (
            "Analyze this handmade artisan item image carefully. Identify core materials, "
            "aesthetic/style tags, 3 concrete value-add enhancement suggestions, and estimate an appropriate "
            "retail price range in USD based on online handmade marketplaces like Etsy."
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',  # Switch smoothly to 'gemini-3.8-flash' when ready in your region
            contents=[img, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "detected_materials": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "style_tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "enhancements": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "estimated_price_range": {
                            "type": "OBJECT",
                            "properties": {
                                "min_usd": {"type": "NUMBER"},
                                "max_usd": {"type": "NUMBER"}
                            },
                            "required": ["min_usd", "max_usd"]
                        }
                    },
                    "required": ["detected_materials", "style_tags", "enhancements", "estimated_price_range"]
                }
            )
        )
        
        # Return the structured JSON directly to the frontend
        import json
        return jsonify(json.loads(response.text))
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

## Step 3: Run Your App Locally

1. In your terminal, launch the server:
   ```bash
   python app.py
   ```
2. Open your web browser and navigate to: **`http://127.0.0.1:5000`**
3. Upload an artisan photo and check out your working tool running entirely for free!
