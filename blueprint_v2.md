# Artisan AI Analyzer - Production Blueprint V2

This blueprint extends the previous version to include structured e-commerce metadata generation (Title, Description, Category, Tags, and Attributes) along with pricing, all running on the **100% free tier** using `gemini-2.5-flash` or `gemini-3.8-flash`.

## Updated App Code (`app.py`)

```python
import os
from flask import Flask, request, jsonify, render_template_string
from google import genai
from google.genai import types
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Initialize the Gemini Client using the new SDK
# It automatically picks up GEMINI_API_KEY from your environment variables
client = genai.Client()

# Minimalist HTML Frontend
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Artisan AI Listing Generator</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9f9f9; color: #333; max-width: 650px; margin: 40px auto; padding: 20px; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { margin-top: 0; color: #111; font-size: 24px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
        input[type="file"] { display: block; width: 100%; padding: 10px; border: 1px dashed #ccc; border-radius: 6px; background: #fafafa; }
        button { background: #000; color: #fff; border: none; padding: 12px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; width: 100%; margin-top: 10px; }
        button:hover { background: #222; }
        #loading { display: none; color: #666; font-size: 14px; margin-top: 15px; text-align: center; }
        #result { margin-top: 30px; display: none; }
        .section-title { font-weight: bold; margin-top: 15px; color: #000; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .tag { display: inline-block; background: #eee; padding: 4px 8px; margin: 4px 4px 4px 0; border-radius: 4px; font-size: 13px; }
        ul { padding-left: 20px; margin: 5px 0; }
        li { font-size: 14px; margin-bottom: 5px; }
        p { font-size: 14px; line-height: 1.5; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Artisan AI Listing Generator</h1>
        <p style="color: #666; margin-bottom: 20px;">Upload your handmade creation to instantly generate an optimized e-commerce title, full description, category tree, tags, structural attributes, and estimated market pricing.</p>
        
        <form id="uploadForm">
            <div class="form-group">
                <label for="itemImage">Select Artisan Item Image</label>
                <input type="file" id="itemImage" accept="image/*" required>
            </div>
            <button type="submit">Analyze & Generate Listing</button>
        </form>
        
        <div id="loading">✨ AI is analyzing your item textures and generating marketplace data...</div>
        
        <div id="result">
            <div class="section-title">✨ Optimized Title</div>
            <p id="resTitle" style="font-size: 18px; font-weight: 600; color: #111;"></p>
            
            <div class="section-title">📁 Marketplace Category</div>
            <p id="resCategory"></p>
            
            <div class="section-title">🏷️ Search Tags</div>
            <div id="resTags"></div>
            
            <div class="section-title">⚙️ Specific Attributes</div>
            <ul id="resAttributes"></ul>
            
            <div class="section-title">💰 Estimated Market Value</div>
            <p id="resPrice" style="font-size: 16px; font-weight: bold; color: #2e7d32;"></p>
            
            <div class="section-title">📝 Product Description</div>
            <p id="resDescription"></p>
            
            <div class="section-title">💡 Value Improvement Tips</div>
            <ul id="resImprovements"></ul>
        </div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('itemImage');
            if (!fileInput.files[0]) return;

            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').style.display = 'none';

            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                
                if (data.error) {
                    alert('Error: ' + data.error);
                    return;
                }

                // Populate UI elements
                document.getElementById('resTitle').innerText = data.title;
                document.getElementById('resCategory').innerText = data.category;
                document.getElementById('resDescription').innerText = data.description;
                document.getElementById('resPrice').innerText = `$${data.estimated_price_range.min.toFixed(2)} - $${data.estimated_price_range.max.toFixed(2)} USD`;
                
                // Tags
                const tagsDiv = document.getElementById('resTags');
                tagsDiv.innerHTML = '';
                data.tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tag';
                    span.innerText = tag;
                    tagsDiv.appendChild(span);
                });

                // Attributes
                const attrUl = document.getElementById('resAttributes');
                attrUl.innerHTML = '';
                for (const [key, value] of Object.entries(data.attributes)) {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${key}:</strong> ${value}`;
                    attrUl.appendChild(li);
                }

                // Improvements
                const impUl = document.getElementById('resImprovements');
                impUl.innerHTML = '';
                data.improvements.forEach(imp => {
                    const li = document.createElement('li');
                    li.innerText = imp;
                    impUl.appendChild(li);
                });

                document.getElementById('result').style.display = 'block';
            } catch (err) {
                alert('An error occurred during submission.');
                console.error(err);
            } finally {
                document.getElementById('loading').style.display = 'none';
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
        return jsonify({'error': 'No image file uploaded'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Convert the uploaded file to a PIL Image
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes))
        
        # Formulate the prompt explicitly asking for e-commerce metadata structure
        prompt = (
            "You are an expert e-commerce optimization AI for premium artisan marketplaces. "
            "Analyze the attached photo of this handcrafted item. "
            "Generate a structured, ready-to-list product object containing the fields specified in the output schema."
        )

        # Enforce strict Structured Outputs using the GenAI SDK config options
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Or switch to 'gemini-3.8-flash'
            contents=[image, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING", "description": "An SEO-optimized, highly catchy title for an artisan listing (approx. 60-80 characters)."},
                        "description": {"type": "STRING", "description": "An engaging, rich product description storytelling the craft, visual details, and potential uses (1-2 short paragraphs)."},
                        "category": {"type": "STRING", "description": "The exact multi-level marketplace category breadcrumb path, e.g., 'Home & Living > Kitchen & Dining > Cookware'."},
                        "tags": {
                            "type": "ARRAY", 
                            "items": {"type": "STRING"},
                            "description": "A list of 8-13 relevant search keywords and tags for marketplace optimization."
                        },
                        "attributes": {
                            "type": "OBJECT",
                            "description": "Key structural physical attributes extracted from visual data (e.g., primary materials, primary colors, style, techniques used).",
                            "properties": {
                                "Primary Materials": {"type": "STRING"},
                                "Primary Colors": {"type": "STRING"},
                                "Design Aesthetic": {"type": "STRING"},
                                "Estimated Craft Method": {"type": "STRING"}
                            },
                            "required": ["Primary Materials", "Primary Colors", "Design Aesthetic", "Estimated Craft Method"]
                        },
                        "improvements": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                            "description": "3 specific actionable recommendations to improve the item's photographic appeal or physical finishing to yield higher pricing."
                        },
                        "estimated_price_range": {
                            "type": "OBJECT",
                            "description": "A fair retail valuation range in USD based on online creative craft platforms.",
                            "properties": {
                                "min": {"type": "NUMBER"},
                                "max": {"type": "NUMBER"}
                            },
                            "required": ["min", "max"]
                        }
                    },
                    "required": ["title", "description", "category", "tags", "attributes", "improvements", "estimated_price_range"]
                }
            )
        )

        # The response text is guaranteed to be pure, parseable JSON conforming exactly to the schema
        return response.text, 200, {'Content-Type': 'application/json'}

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```
