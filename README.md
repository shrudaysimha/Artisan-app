# CraftLens — Artisan AI Appraisal & Fair Pricing Studio (Artisan-app)

CraftLens (Kalaa Setu) is an AI-powered visual appraisal, fair pricing, and smart cataloging platform built for rural Indian artisans. It bridges traditional Indian heritage craftsmanship directly with digital commerce (such as ONDC) by removing predatory middlemen and ensuring fair, living-wage compensation.

---

## 🌟 Key Features

- **Dual-Shot & Macro Computer Vision:** Analyzes craft photos (contextual overview + macro texture) using fast multimodal vision AI (Groq LPU / Qwen Vision & CraftLens GI Vision Engine).
- **Automated Background Removal:** Server-side AI background isolation (`rembg`) turns raw artisan workshop photos into e-commerce-ready catalog assets.
- **Physical Scale & Mass Estimation:** Detects scale reference markers (such as a ₹10 coin or matchbox) to compute physical dimensions in cm³ and realistic physical mass based on material densities.
- **Fair-Trade Market Pricing Engine:** Combines empirical handicraft marketplace benchmarks (ONDC, Fabindia, CCIC, Amazon Karigar) with statutory living wage minimum floor protections:
  - **Wholesale Minimum:** Inviolable living wage floor based on state artisan wage indices.
  - **Suggested Retail:** Fair-trade direct-to-consumer price giving artisans 68%–75% direct share.
  - **Export / Boutique Ceiling:** Premium pricing for gift packaging, provenance certificates, and boutique retail.
- **Indic Localization & Storytelling:** Live integration with India's Bhashini NMT supporting 22 scheduled Indian languages.
- **ONDC Beckn Protocol Compatible:** Generates structured catalog listings ready for direct publication.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, Redux Toolkit, Lucide Icons, Web Speech API.
- **Backend:** FastAPI (Python 3.10+), Pydantic v2, Uvicorn, Pillow, rembg.
- **AI / LLM Layer:** Groq LPU API, Bhashini NMT API, CraftLens GI Knowledge Graph.
- **Database:** SQLite (`catalog.db`) with ONDC catalog schema.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/shrudaysimha/Artisan-app.git
cd Artisan-app
```

### 2. Backend Setup (FastAPI)
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and insert your GROQ_API_KEY and BHASHINI_API_KEY

# Start backend server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation is accessible at `http://localhost:8000/docs`.

### 3. Frontend Setup (Next.js)
```bash
cd frontend/client

# Install frontend dependencies
npm install

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Note
All sensitive environment variables, credentials, and API keys are strictly excluded via `.gitignore`. Never commit `.env` or `.env.local` files to version control.
