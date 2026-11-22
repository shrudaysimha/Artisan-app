"""
Artisan Camera — FastAPI Backend
Main application with image analysis, pricing, and catalog endpoints.
"""

import os
import json
import uuid
import base64
import logging
import asyncio
from typing import Optional
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

from backend.database import init_db, seed_material_rates, seed_regional_wages, seed_craft_families
from backend.database import save_catalog_item, get_catalog_items, get_catalog_item, delete_catalog_item
from backend.vision import analyze_craft, screen_image
from backend.pricing import calculate_pricing
from backend.bg_removal import remove_background, compress_image
from backend.models import AnalysisResponse, CraftAttributes, PricingBreakdown, PublishRequest

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
FRONTEND_DIR = BASE_DIR.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    logger.info("🚀 Starting Artisan Camera backend...")
    await init_db()
    await seed_material_rates()
    await seed_regional_wages()
    await seed_craft_families()
    logger.info("✅ Database initialized and seeded.")
    yield
    logger.info("👋 Shutting down...")


app = FastAPI(
    title="Artisan Camera API",
    description="AI-powered handicraft pricing and cataloging",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from backend.kalaa_routes import kalaa_router
from backend.bhashini import router as bhashini_router

# ── API Routes ──────────────────────────────────────────────────────────────

app.include_router(kalaa_router)
app.include_router(bhashini_router)


async def _run_analysis(image_bytes: bytes, language: str, state: str,
                        voice_description: str, needs_bg_removal: bool,
                        weight_grams: Optional[float] = None,
                        crafting_hours: Optional[float] = None,
                        is_hollow: Optional[str] = None,
                        scale_reference: Optional[str] = None):
    """Core analysis logic extracted so we can wrap it in a timeout."""
    # Compress image
    compressed = compress_image(image_bytes)

    logger.info(f"Received craft photo: {len(image_bytes)} bytes → compressed {len(compressed)} bytes")

    # Screen image: reject non-craft items before expensive analysis
    is_craft = await screen_image(compressed)
    if not is_craft:
        logger.info("Image rejected: not a handicraft")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "not_a_craft",
                "message": "This doesn't appear to be a handmade craft or artisan product. Please photograph a handicraft item."
            }
        )

    # Background removal (if client requested it)
    bg_removed = False
    processed = compressed

    if needs_bg_removal:
        try:
            loop = asyncio.get_running_loop()
            processed = await asyncio.wait_for(
                loop.run_in_executor(None, remove_background, compressed),
                timeout=8.0
            )
            bg_removed = True
            logger.info("Background removal completed on server")
        except asyncio.TimeoutError:
            logger.warning("Background removal exceeded 8s limit — skipping")
        except Exception as e:
            logger.warning(f"BG removal failed, using original: {e}")

    # Save processed image
    img_id = str(uuid.uuid4())[:8]
    img_path = UPLOADS_DIR / f"{img_id}_craft.jpg"
    with open(img_path, "wb") as f:
        f.write(processed)

    # Run Vision AI analysis (single image)
    craft_data = await analyze_craft(
        processed,
        language=language,
        voice_description=voice_description
    )

    # Determine confirmed weight and source (never guess blindly!)
    if weight_grams and weight_grams > 0:
        final_weight = weight_grams
        weight_src = "artisan_confirmed"
    elif craft_data.get("weight_grams"):
        final_weight = craft_data["weight_grams"]
        weight_src = craft_data.get("weight_source", "voice_extracted")
    else:
        final_weight = None
        weight_src = "estimated"

    # Determine confirmed crafting hours and source
    if crafting_hours and crafting_hours > 0:
        final_hours = crafting_hours
        hours_src = "artisan_confirmed"
    elif craft_data.get("estimated_hours"):
        final_hours = craft_data["estimated_hours"]
        hours_src = craft_data.get("hours_source", "voice_extracted")
    else:
        final_hours = 2.0
        hours_src = "estimated"

    # Determine hollow vs solid construction
    if is_hollow is not None:
        final_hollow = is_hollow.lower() == "true"
    else:
        final_hollow = craft_data.get("is_hollow", False)

    final_scale_ref = scale_reference or craft_data.get("scale_reference_detected")

    # Calculate pricing with true physical verification and real-world market comps
    pricing = await calculate_pricing(
        materials_detected=craft_data.get("materials_detected", []),
        workmanship_level=craft_data.get("workmanship_level", 3),
        estimated_hours=final_hours,
        state=state,
        weight_grams=final_weight,
        weight_source=weight_src,
        is_hollow=final_hollow,
        scale_reference_detected=final_scale_ref,
        hours_source=hours_src,
        craft_type=craft_data.get("craft_type", ""),
        regional_style=craft_data.get("regional_style", ""),
        dimensions_cm=craft_data.get("dimensions_cm"),
        market_analysis=craft_data.get("market_analysis"),
    )

    # Build catalog card
    catalog_card = {
        "title": craft_data.get("title", "Handcrafted Item"),
        "description": craft_data.get("description", ""),
        "craft_story": craft_data.get("craft_story", ""),
        "bullet_points": craft_data.get("bullet_points", []),
        "tags": craft_data.get("tags", []),
        "price_range": f"₹{int(pricing.wholesale_floor)} - ₹{int(pricing.premium_ceiling)}",
        "recommended_price": f"₹{int(pricing.retail_recommended)}",
        "physical_verification_badge": pricing.physical_verification_badge,
    }

    # Build response
    response = {
        "success": True,
        "craft": craft_data,
        "pricing": pricing.model_dump(),
        "catalog_card": catalog_card,
        "bg_removed": bg_removed,
        "craft_image_url": f"/api/images/{img_id}_craft.jpg",
        "full_view_url": f"/api/images/{img_id}_craft.jpg",
    }

    logger.info(f"Analysis complete: {craft_data.get('craft_type')} — ₹{int(pricing.retail_recommended)} ({pricing.physical_verification_badge})")
    return JSONResponse(content=response)


@app.post("/api/analyze")
async def analyze_handicraft(
    craft_photo: UploadFile = File(..., description="Single photo of the craft item"),
    craft_audio: Optional[UploadFile] = File(default=None, description="Optional audio recording of voice note (Opus/WebM)"),
    language: str = Form(default="en", description="Language code (en, hi, ta, te, kn)"),
    needs_bg_removal: str = Form(default="false", description="Whether server should remove background"),
    state: str = Form(default="Default", description="Indian state for regional wage"),
    voice_description: str = Form(default="", description="Artisan's own spoken description transcript"),
    weight_grams: Optional[float] = Form(default=None, description="Physical weight confirmed by artisan in grams"),
    crafting_hours: Optional[float] = Form(default=None, description="Crafting labor hours confirmed by artisan"),
    is_hollow: Optional[str] = Form(default=None, description="Whether craft is hollow or solid: 'true'/'false'"),
    scale_reference: Optional[str] = Form(default=None, description="Scale reference placed beside craft (e.g. '₹10 coin', 'matchbox')"),
):
    """
    Main analysis endpoint with physical scale verification and rural network resilience.
    Guaranteed to respond within 25 seconds. Never guesses weight or hours blindly.
    """
    try:
        image_bytes = await craft_photo.read()
        bg_removal = needs_bg_removal.lower() == "true"

        # Read optional low-bitrate Opus audio if provided
        audio_bytes = None
        if craft_audio:
            try:
                audio_bytes = await craft_audio.read()
                logger.info(f"Received rural low-bitrate audio note: {len(audio_bytes)} bytes ({craft_audio.content_type})")
            except Exception as e:
                logger.warning(f"Could not read uploaded audio: {e}")

        # Wrap entire analysis in a 25-second timeout to allow Vision AI & Bhashini chaining without false heuristic timeouts
        result = await asyncio.wait_for(
            _run_analysis(
                image_bytes, language, state, voice_description, bg_removal,
                weight_grams, crafting_hours, is_hollow, scale_reference
            ),
            timeout=25.0
        )
        return result

    except asyncio.TimeoutError:
        logger.error("Analysis timed out after 25 seconds — returning fallback")
        from backend.vision import generate_curated_craft_appraisal
        fallback_craft = generate_curated_craft_appraisal(language, voice_description)
        
        fallback_weight = weight_grams if (weight_grams and weight_grams > 0) else fallback_craft.get("weight_grams")
        fallback_weight_src = "artisan_confirmed" if weight_grams else fallback_craft.get("weight_source", "estimated")
        fallback_hours = crafting_hours if (crafting_hours and crafting_hours > 0) else fallback_craft.get("estimated_hours", 2.0)
        fallback_hours_src = "artisan_confirmed" if crafting_hours else fallback_craft.get("hours_source", "estimated")
        fallback_hollow = (is_hollow.lower() == "true") if is_hollow is not None else fallback_craft.get("is_hollow", False)

        fallback_pricing = await calculate_pricing(
            materials_detected=fallback_craft.get("materials_detected", []),
            workmanship_level=fallback_craft.get("workmanship_level", 3),
            estimated_hours=fallback_hours,
            state=state,
            weight_grams=fallback_weight,
            weight_source=fallback_weight_src,
            is_hollow=fallback_hollow,
            scale_reference_detected=scale_reference or fallback_craft.get("scale_reference_detected"),
            hours_source=fallback_hours_src,
            craft_type=fallback_craft.get("craft_type", ""),
            regional_style=fallback_craft.get("regional_style", ""),
            dimensions_cm=fallback_craft.get("dimensions_cm"),
            market_analysis=fallback_craft.get("market_analysis"),
        )
        return JSONResponse(content={
            "success": True,
            "craft": fallback_craft,
            "pricing": fallback_pricing.model_dump(),
            "catalog_card": {
                "title": fallback_craft.get("title", "Handcrafted Item"),
                "description": fallback_craft.get("description", ""),
                "price_range": f"₹{int(fallback_pricing.wholesale_floor)} - ₹{int(fallback_pricing.premium_ceiling)}",
                "recommended_price": f"₹{int(fallback_pricing.retail_recommended)}",
                "physical_verification_badge": fallback_pricing.physical_verification_badge,
            },
            "bg_removed": False,
            "timeout_fallback": True,
        })

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/catalog/publish")
async def publish_item(request: PublishRequest):
    """Save a confirmed catalog item to the database."""
    try:
        item_data = request.model_dump()

        # Save base64 images if provided
        if request.full_view_base64:
            img_id = str(uuid.uuid4())[:8]
            full_path = UPLOADS_DIR / f"{img_id}_pub_full.jpg"
            with open(full_path, "wb") as f:
                f.write(base64.b64decode(request.full_view_base64))
            item_data["full_view_path"] = f"/api/images/{img_id}_pub_full.jpg"

        if request.detail_view_base64:
            img_id = str(uuid.uuid4())[:8]
            detail_path = UPLOADS_DIR / f"{img_id}_pub_detail.jpg"
            with open(detail_path, "wb") as f:
                f.write(base64.b64decode(request.detail_view_base64))
            item_data["detail_view_path"] = f"/api/images/{img_id}_pub_detail.jpg"

        # Remove base64 from storage
        item_data.pop("full_view_base64", None)
        item_data.pop("detail_view_base64", None)

        item_id = await save_catalog_item(item_data)

        return JSONResponse(content={
            "success": True,
            "item_id": item_id,
            "message": "Item published successfully!"
        })

    except Exception as e:
        logger.error(f"Publishing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Publishing failed: {str(e)}")


@app.get("/api/catalog/items")
async def list_catalog_items(limit: int = 50, offset: int = 0):
    """List published catalog items."""
    items = await get_catalog_items(limit=limit, offset=offset)
    return JSONResponse(content={"success": True, "items": items, "count": len(items)})


@app.get("/api/catalog/items/{item_id}")
async def get_single_item(item_id: int):
    """Get a single catalog item by ID."""
    item = await get_catalog_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return JSONResponse(content={"success": True, "item": item})


@app.delete("/api/catalog/items/{item_id}")
async def delete_single_item(item_id: int):
    """Delete a published catalog item from ONDC."""
    item = await get_catalog_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    deleted = await delete_catalog_item(item_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete item")

    logger.info(f"🗑️ Deleted catalog item {item_id}: {item.get('title')}")
    return JSONResponse(content={
        "success": True,
        "message": f"Craft '{item.get('title')}' successfully removed from ONDC and catalog.",
        "deleted_id": item_id
    })



@app.get("/api/images/{filename}")
async def serve_image(filename: str):
    """Serve uploaded/processed images."""
    filepath = UPLOADS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(filepath, media_type="image/jpeg")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Artisan Camera API"}


@app.get("/api/config/status")
async def config_status():
    """Returns AI keys and service readiness."""
    groq_key = os.environ.get("GROQ_API_KEY", "")
    return {
        "groq_configured": bool(groq_key and not groq_key.startswith("your_") and len(groq_key.strip()) > 10),
        "bhashini_configured": bool(os.environ.get("BHASHINI_API_KEY")),
        "gemini_configured": bool(os.environ.get("GEMINI_API_KEY")),
    }


# ── API Only Backend ────────────────────────────────────────────────────────
# Static Next.js frontend is served separately by Next server in dev mode.
