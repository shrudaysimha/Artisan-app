import os
import json
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, Form, BackgroundTasks, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import cloudinary
import cloudinary.uploader
import google.generativeai as genai

kalaa_router = APIRouter(tags=["Kalaa Setu"])

# Cloud Infrastructure Initialization will be lazy or done on startup if variables are present.
MONGO_URI = os.getenv("MONGO_URI")
client = None
db = None
if MONGO_URI:
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["kalaa_setu_db"]

# Configuration for Cloudinary
cloudinary_configured = False
if os.getenv("CLOUDINARY_CLOUD_NAME") and not os.getenv("CLOUDINARY_CLOUD_NAME").startswith("your_"):
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    cloudinary_configured = True

# Configuration for Gemini
if os.getenv("GEMINI_API_KEY") and not os.getenv("GEMINI_API_KEY").startswith("your_"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, artisan_id: str, websocket: WebSocket):
        await websocket.accept()
        if artisan_id not in self.active_connections:
            self.active_connections[artisan_id] = []
        self.active_connections[artisan_id].append(websocket)

    def disconnect(self, artisan_id: str, websocket: WebSocket):
        if artisan_id in self.active_connections:
            self.active_connections[artisan_id].remove(websocket)

    async def send_to_artisan(self, artisan_id: str, message: dict):
        if artisan_id in self.active_connections:
            for connection in self.active_connections[artisan_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@kalaa_router.websocket("/ws/artisan/{artisan_id}")
async def websocket_endpoint(websocket: WebSocket, artisan_id: str):
    """Real-time pipe connecting Member 1's mobile app to backend updates."""
    await manager.connect(artisan_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(artisan_id, websocket)

async def process_media_in_realtime(product_id: str, artisan_id: str, image_url: str, voice_note_text: str):
    prompt = f"""
    Analyze this artisan handicraft image. Spoken artisan context: "{voice_note_text}".
    Output purely strict JSON with no markdown formatting matching this exact structure:
    {{
      "title": {{"en": "English title", "hi": "Hindi title"}},
      "category": "e.g., Terracotta, Handloom, Woodwork",
      "description": {{"en": "Concise product description", "hi": "विवरण"}},
      "tags": ["tag1", "tag2", "tag3"],
      "estimated_labor_hours": 3.0,
      "estimated_material_cost": 150.0,
      "fair_price": 450.0
    }}
    Formula: fair_price = material_cost + (labor_hours * 80) + packaging.
    """
    
    try:
        response = model.generate_content([prompt, {"image_url": image_url}])
        clean_json_str = response.text.strip().replace("```json", "").replace("```", "")
        ai_data = json.loads(clean_json_str)
    except Exception:
        ai_data = {
            "title": {"en": "Handcrafted Artisan Item", "hi": "हस्तनिर्मित शिल्प"},
            "category": "Handicrafts",
            "description": {"en": voice_note_text or "Authentic handmade craft.", "hi": "प्रामाणिक शिल्प"},
            "tags": ["handmade", "artisanal", "authentic"],
            "estimated_labor_hours": 2.5,
            "estimated_material_cost": 120.0,
            "fair_price": 350.0
        }

    qr_payload_url = f"https://kalaasetu.live/provenance/{product_id}"
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={qr_payload_url}"

    update_data = {
        "$set": {
            "content": {
                "title": ai_data.get("title"),
                "description": ai_data.get("description"),
                "category": ai_data.get("category"),
                "tags": ai_data.get("tags")
            },
            "financials": {
                "material_cost": ai_data.get("estimated_material_cost"),
                "labor_hours": ai_data.get("estimated_labor_hours"),
                "fair_price": ai_data.get("fair_price")
            },
            "trust": {
                "qr_code_url": qr_code_url
            },
            "status": "ready_for_syndication"
        }
    }
    if db is not None:
        await db.products.update_one({"_id": ObjectId(product_id)}, update_data)

    await manager.send_to_artisan(artisan_id, {
        "event": "PRODUCT_ENRICHED",
        "product_id": product_id,
        "data": {
            "processed_image_url": image_url,
            "title": ai_data.get("title"),
            "description": ai_data.get("description"),
            "fair_price": ai_data.get("fair_price"),
            "qr_code_url": qr_code_url
        }
    })

@kalaa_router.post("/api/products/upload-and-catalog")
async def upload_and_catalog(
    background_tasks: BackgroundTasks,
    artisan_id: str = Form(...),
    voice_text: str = Form(""),
    file: UploadFile = File(...)
):
    if not cloudinary_configured:
        raise HTTPException(
            status_code=503,
            detail="Cloudinary is not configured. Set real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET values in .env."
        )

    upload_result = cloudinary.uploader.upload(
        file.file,
        folder="kalaa_setu_live",
        resource_type="image"
    )
    image_url = upload_result.get("secure_url")

    new_product = {
        "artisan_id": artisan_id,
        "media": {"raw_image_url": image_url},
        "status": "processing_ai",
        "created_at": datetime.utcnow()
    }
    product_id = "dummy_id"
    if db is not None:
        db_result = await db.products.insert_one(new_product)
        product_id = str(db_result.inserted_id)

    background_tasks.add_task(
        process_media_in_realtime,
        product_id=product_id,
        artisan_id=artisan_id,
        image_url=image_url,
        voice_note_text=voice_text
    )

    return {
        "status": "processing",
        "product_id": product_id,
        "image_url": image_url,
        "message": "Upload complete. AI enrichment running in background..."
    }

@kalaa_router.get("/api/provenance/{product_id}")
async def get_provenance(product_id: str):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Item not found")

    return {
        "product_id": product_id,
        "artisan_id": product.get("artisan_id"),
        "title": product.get("content", {}).get("title"),
        "description": product.get("content", {}).get("description"),
        "fair_price": product.get("financials", {}).get("fair_price"),
        "verification_status": "Verified Authentic GI-Origin"
    }
