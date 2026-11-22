"""
Pydantic models for request/response validation.
All pricing math is transparent — every field in PricingBreakdown
is returned to the frontend so the artisan sees exactly how the price was computed.
"""

from pydantic import BaseModel, Field
from typing import Optional, Union, Any


class MaterialCost(BaseModel):
    """Individual material cost breakdown."""
    material: str = Field(..., description="Material name (e.g., 'Teak Wood')")
    quantity_estimate: str = Field(..., description="Estimated quantity used (e.g., '0.5 kg')")
    rate_per_unit: float = Field(..., description="Current wholesale rate in ₹")
    unit: str = Field(..., description="Unit of measurement (e.g., 'kg', 'meter', 'piece')")
    total_cost: float = Field(..., description="Computed cost for this material")


class PricingBreakdown(BaseModel):
    """Transparent 3-tier pricing with full math visibility."""
    # Direct Material Cost
    materials: list[MaterialCost] = Field(default_factory=list)
    total_material_cost: float = Field(0.0, description="Sum of all material costs in ₹")

    # Physical Weight & Construction Verification
    weight_grams: Optional[float] = Field(None, description="Physical weight in grams")
    weight_source: str = Field("estimated", description="Source of weight: 'artisan_confirmed', 'voice_extracted', 'scale_reference', or 'estimated'")
    is_hollow: bool = Field(False, description="Whether the craft is hollow-cast / thin-walled or solid")
    scale_reference_detected: Optional[str] = Field(None, description="Scale marker detected in frame (e.g., '₹10 coin', 'matchbox')")

    # Fair Labor Valuation
    estimated_hours: float = Field(0.0, description="Hours of skilled labor")
    hours_source: str = Field("estimated", description="Source of hours: 'artisan_confirmed', 'voice_extracted', or 'estimated'")
    hourly_wage_rate: float = Field(0.0, description="Regional skilled artisan wage in ₹/hour")
    labor_cost: float = Field(0.0, description="estimated_hours × hourly_wage_rate")

    # Physical Verification Badge
    physical_verification_badge: str = Field("", description="Human-readable verification badge")

    # Real-World Market Analysis
    market_benchmark_retail: float = Field(0.0, description="Empirical market comparable retail price on ONDC/e-commerce in ₹")
    market_comp_summary: str = Field("", description="Explanation of real market comps used")
    artisan_share_percentage: float = Field(70.0, description="Direct percentage of retail price paid to the artisan")
    pricing_method: str = Field("market_analysis_and_living_wage_floor", description="Pricing methodology used")

    # 3-Tier Price Range
    wholesale_floor: float = Field(0.0, description="Minimum wholesale price (living wage guarantee)")
    retail_recommended: float = Field(0.0, description="Fair e-commerce / direct-to-consumer price")
    premium_ceiling: float = Field(0.0, description="High-end boutique / export potential price")

    # Multipliers used (for transparency)
    wholesale_margin: float = Field(0.15, description="Margin over cost for wholesale")
    retail_multiplier: float = Field(1.35, description="Realistic e-commerce margin over wholesale")
    premium_multiplier: float = Field(1.50, description="Boutique / export multiplier over retail")


class CraftAttributes(BaseModel):
    """Extracted attributes from Vision AI analysis."""
    craft_type: str = Field(..., description="Craft family (e.g., 'Madhubani Painting')")
    regional_style: str = Field("", description="Regional variant or sub-style")
    materials_detected: list[str] = Field(default_factory=list, description="Detected materials")
    workmanship_level: int = Field(3, ge=1, le=5, description="Complexity score 1-5")
    estimated_hours: float = Field(1.0, description="Estimated crafting hours")
    hours_source: str = Field("estimated", description="Source of hours: 'artisan_confirmed', 'voice_extracted', 'estimated'")
    weight_grams: Optional[float] = Field(None, description="Weight in grams")
    weight_source: str = Field("estimated", description="Source of weight")
    is_hollow: bool = Field(False, description="Hollow vs solid construction")
    scale_reference_detected: Optional[str] = Field(None, description="Detected scale reference in image")
    dimensions_cm: Optional[dict[str, float]] = Field(None, description="Estimated physical dimensions in cm")
    description: str = Field("", description="Short product description")
    craft_story: str = Field("", description="Cultural story or significance")
    title: str = Field("", description="Generated product title")
    bullet_points: list[str] = Field(default_factory=list, description="Catalog bullet points")
    tags: list[str] = Field(default_factory=list, description="Searchable craft tags")
    market_analysis: Optional[dict] = Field(default_factory=dict, description="Market comps from vision AI")


class AnalysisResponse(BaseModel):
    """Complete response from /api/analyze endpoint."""
    success: bool = True
    craft: CraftAttributes
    pricing: PricingBreakdown
    catalog_card: dict = Field(default_factory=dict, description="Ready-to-publish catalog card data")
    bg_removed: bool = Field(False, description="Whether background was removed server-side")
    full_view_url: str = Field("", description="URL to processed full view image")
    detail_view_url: str = Field("", description="URL to processed detail view image")


class CatalogItem(BaseModel):
    """Published catalog item stored in database."""
    id: Optional[int] = None
    title: str
    craft_type: str
    regional_style: str = ""
    description: str = ""
    craft_story: str = ""
    materials: str = ""  # JSON string of materials list
    workmanship_level: int = 3
    final_price: float = 0.0
    wholesale_floor: float = 0.0
    retail_recommended: float = 0.0
    premium_ceiling: float = 0.0
    pricing_breakdown: str = ""  # JSON string of full breakdown
    bullet_points: str = ""  # JSON string of bullet points list
    tags: str = ""  # JSON string of tags list
    full_view_path: str = ""
    detail_view_path: str = ""
    language: str = "en"
    created_at: Optional[str] = None


class PublishRequest(BaseModel):
    """Request body for publishing a confirmed item to ONDC / CraftLens."""
    title: str
    craft_type: str
    regional_style: str = ""
    description: str = ""
    craft_story: str = ""
    english_title: str = ""
    english_description: str = ""
    materials: Union[list[str], str] = Field(default_factory=list)
    workmanship_level: int = 3
    final_price: float
    wholesale_floor: float = 0.0
    retail_recommended: float = 0.0
    premium_ceiling: float = 0.0
    pricing_breakdown: Union[dict, str, Any] = Field(default_factory=dict)
    bullet_points: Union[list[str], str, Any] = Field(default_factory=list)
    tags: Union[list[str], str, Any] = Field(default_factory=list)
    full_view_path: str = ""
    detail_view_path: str = ""
    full_view_base64: str = ""
    detail_view_base64: str = ""
    language: str = "en"
