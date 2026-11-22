"""
Bhashini Udhyat & Dhruva AI Integration
Enables Government of India Bhashini NMT (Neural Machine Translation),
ASR (Speech-to-Text), and TTS for Indian Artisans across 22 Scheduled Languages.
"""

import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/bhashini", tags=["Bhashini Translation & Voice"])

DEFAULT_BHASHINI_ENDPOINT = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"


class TranslationRequest(BaseModel):
    text: str
    source_lang: str = "en"
    target_lang: str = "te"
    api_key: Optional[str] = None
    user_id: Optional[str] = None
    endpoint: Optional[str] = None


class BatchTranslationRequest(BaseModel):
    texts: List[str]
    source_lang: str = "en"
    target_lang: str = "te"
    api_key: Optional[str] = None
    user_id: Optional[str] = None
    endpoint: Optional[str] = None


class ASRRequest(BaseModel):
    audio_base64: str
    source_lang: str = "te"
    audio_format: str = "wav"
    api_key: Optional[str] = None
    user_id: Optional[str] = None
    endpoint: Optional[str] = None


def get_credentials(req_key: Optional[str], req_user: Optional[str], req_endpoint: Optional[str]):
    key = req_key or os.getenv("BHASHINI_API_KEY") or os.getenv("BHASHINI_UDHYAT_KEY")
    user = req_user or os.getenv("BHASHINI_USER_ID") or ""
    endpoint = req_endpoint or os.getenv("BHASHINI_INFERENCE_URL") or DEFAULT_BHASHINI_ENDPOINT
    return key, user, endpoint


@router.get("/status")
async def bhashini_status():
    """Returns the operational status of the Bhashini Government AI Gateway."""
    key = os.getenv("BHASHINI_API_KEY") or os.getenv("BHASHINI_UDHYAT_KEY")
    return {
        "status": "ready",
        "has_server_key": bool(key),
        "default_endpoint": DEFAULT_BHASHINI_ENDPOINT,
        "supported_languages": [
            {"code": "en", "name": "English"},
            {"code": "te", "name": "తెలుగు (Telugu)"},
            {"code": "hi", "name": "हिन्दी (Hindi)"},
            {"code": "ta", "name": "தமிழ் (Tamil)"},
            {"code": "kn", "name": "ಕನ್ನಡ (Kannada)"},
            {"code": "bn", "name": "বাংলা (Bengali)"},
            {"code": "mr", "name": "मराठी (Marathi)"},
            {"code": "gu", "name": "ગુજરાતી (Gujarati)"},
            {"code": "or", "name": "ଓଡ଼ିଆ (Odia)"},
            {"code": "ml", "name": "മലയാളം (Malayalam)"},
            {"code": "pa", "name": "ਪੰਜਾਬੀ (Punjabi)"},
            {"code": "as", "name": "অসমীয়া (Assamese)"},
            {"code": "ur", "name": "اردو (Urdu)"}
        ]
    }


@router.post("/translate")
async def translate_text(req: TranslationRequest):
    """
    Translates artisan text (descriptions, appraisals, queries) using Bhashini Dhruva NMT.
    """
    key, user_id, endpoint = get_credentials(req.api_key, req.user_id, req.endpoint)

    if not key:
        return {
            "success": False,
            "error": "Bhashini API Key is missing. Please provide your Bhashini Udhyat Key in the UI or environment variables.",
            "translated_text": req.text,
            "source_lang": req.source_lang,
            "target_lang": req.target_lang,
            "source": "untranslated"
        }

    # Bhashini ULCA / Dhruva inference request format
    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": req.source_lang,
                        "targetLanguage": req.target_lang
                    }
                }
            }
        ],
        "inputData": {
            "input": [
                {
                    "source": req.text
                }
            ]
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": key,
        "ulcaApiKey": key,
        "Inference-API-Key": key,
        "apiKey": key,
    }
    if user_id:
        headers["userID"] = user_id
        headers["User-Id"] = user_id
        headers["userId"] = user_id

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                # Parse Bhashini response structure
                output_list = data.get("pipelineResponse", [])
                if output_list and len(output_list) > 0:
                    outputs = output_list[0].get("output", [])
                    if outputs and len(outputs) > 0:
                        target = outputs[0].get("target")
                        return {
                            "success": True,
                            "translated_text": target,
                            "source_lang": req.source_lang,
                            "target_lang": req.target_lang,
                            "source": "bhashini_live"
                        }
                return {
                    "success": False,
                    "error": "Unexpected Bhashini response structure",
                    "raw_response": data,
                    "translated_text": req.text
                }
            else:
                logger.warning(f"Bhashini API returned status {resp.status_code}: {resp.text}")
                return {
                    "success": False,
                    "error": f"Bhashini API returned status {resp.status_code}",
                    "details": resp.text[:200],
                    "translated_text": req.text
                }
    except Exception as e:
        logger.error(f"Error connecting to Bhashini: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "translated_text": req.text
        }


@router.post("/batch-translate")
async def batch_translate(req: BatchTranslationRequest):
    """
    Translates multiple strings in a single call for high efficiency.
    """
    key, user_id, endpoint = get_credentials(req.api_key, req.user_id, req.endpoint)

    if not key:
        return {
            "success": False,
            "error": "Bhashini API Key is missing.",
            "translated_texts": req.texts
        }

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": req.source_lang,
                        "targetLanguage": req.target_lang
                    }
                }
            }
        ],
        "inputData": {
            "input": [{"source": t} for t in req.texts]
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": key,
        "ulcaApiKey": key,
        "Inference-API-Key": key,
        "apiKey": key,
    }
    if user_id:
        headers["userID"] = user_id
        headers["User-Id"] = user_id
        headers["userId"] = user_id

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                output_list = data.get("pipelineResponse", [])
                if output_list:
                    outputs = output_list[0].get("output", [])
                    translated_list = [item.get("target", item.get("source")) for item in outputs]
                    return {
                        "success": True,
                        "translated_texts": translated_list
                    }
            return {
                "success": False,
                "error": f"Status {resp.status_code}: {resp.text[:200]}",
                "translated_texts": req.texts
            }
    except Exception as e:
        logger.error(f"Bhashini batch error: {e}")
        return {
            "success": False,
            "error": str(e),
            "translated_texts": req.texts
        }
