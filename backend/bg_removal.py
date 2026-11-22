"""
Background removal module using rembg.
Server-side fallback for when client-side removal fails or is unavailable.
"""

from rembg import remove, new_session
from PIL import Image
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

_rembg_session = None


def get_rembg_session():
    """Lazy initialize and cache the lightweight u2netp ONNX session."""
    global _rembg_session
    if _rembg_session is None:
        try:
            _rembg_session = new_session("u2netp")
            logger.info("Initialized fast u2netp session for background removal")
        except Exception as e:
            logger.warning(f"Failed to initialize u2netp session: {e}")
            _rembg_session = False
    return _rembg_session if _rembg_session is not False else None


def remove_background(image_bytes: bytes, bg_color: tuple = (255, 255, 255)) -> bytes:
    """
    Remove the background from an image and replace with a solid color.
    Uses cached lightweight u2netp model for sub-second execution.
    """
    try:
        session = get_rembg_session()
        if session is not None:
            output_bytes = remove(image_bytes, session=session)
        else:
            output_bytes = remove(image_bytes)

        # Open the result and composite onto solid background
        fg = Image.open(BytesIO(output_bytes)).convert("RGBA")

        # Create solid background
        bg = Image.new("RGBA", fg.size, (*bg_color, 255))
        composite = Image.alpha_composite(bg, fg).convert("RGB")

        # Save as JPEG
        output_buffer = BytesIO()
        composite.save(output_buffer, format="JPEG", quality=90)
        output_buffer.seek(0)

        logger.info(f"Background removed successfully. Output size: {len(output_buffer.getvalue())} bytes")
        return output_buffer.getvalue()

    except Exception as e:
        logger.error(f"Background removal failed: {e}")
        # Return original image if removal fails
        return image_bytes


def compress_image(image_bytes: bytes, max_width: int = 1080, quality: int = 85) -> bytes:
    """
    Compress and resize an image for bandwidth optimization.

    Args:
        image_bytes: Raw image bytes
        max_width: Maximum width in pixels
        quality: JPEG quality (1-100)

    Returns:
        Compressed image bytes as JPEG.
    """
    try:
        img = Image.open(BytesIO(image_bytes))

        # Resize if too large, maintaining aspect ratio
        if img.width > max_width:
            ratio = max_width / img.width
            new_size = (max_width, int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # Convert to RGB if needed (handles RGBA/palette modes)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Save as compressed JPEG
        output_buffer = BytesIO()
        img.save(output_buffer, format="JPEG", quality=quality, optimize=True)
        output_buffer.seek(0)

        return output_buffer.getvalue()

    except Exception as e:
        logger.error(f"Image compression failed: {e}")
        return image_bytes
