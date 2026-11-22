"""
Database layer using SQLite via aiosqlite.
Stores catalog items, material rates, and regional wage data.
"""

import aiosqlite
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "artisan_catalog.db")


async def get_db():
    """Get database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Initialize database tables."""
    db = await get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS catalog_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                craft_type TEXT NOT NULL,
                regional_style TEXT DEFAULT '',
                description TEXT DEFAULT '',
                craft_story TEXT DEFAULT '',
                materials TEXT DEFAULT '[]',
                workmanship_level INTEGER DEFAULT 3,
                final_price REAL DEFAULT 0.0,
                wholesale_floor REAL DEFAULT 0.0,
                retail_recommended REAL DEFAULT 0.0,
                premium_ceiling REAL DEFAULT 0.0,
                pricing_breakdown TEXT DEFAULT '{}',
                bullet_points TEXT DEFAULT '[]',
                tags TEXT DEFAULT '[]',
                full_view_path TEXT DEFAULT '',
                detail_view_path TEXT DEFAULT '',
                language TEXT DEFAULT 'en',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS material_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_name TEXT UNIQUE NOT NULL,
                category TEXT DEFAULT '',
                rate_per_unit REAL NOT NULL,
                unit TEXT NOT NULL,
                source TEXT DEFAULT 'manual',
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS regional_wages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                state TEXT NOT NULL,
                skill_category TEXT DEFAULT 'skilled',
                daily_wage REAL NOT NULL,
                hourly_wage REAL NOT NULL,
                source TEXT DEFAULT 'manual',
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS craft_families (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                region TEXT DEFAULT '',
                state TEXT DEFAULT '',
                gi_tag INTEGER DEFAULT 0,
                typical_materials TEXT DEFAULT '[]',
                description TEXT DEFAULT ''
            );
        """)
        await db.commit()
    finally:
        await db.close()


async def seed_material_rates():
    """Seed material rates with common handicraft materials."""
    db = await get_db()
    try:
        materials = [
            # Wood
            ("Teak Wood", "wood", 2500.0, "kg", "wholesale_avg"),
            ("Sandalwood", "wood", 15000.0, "kg", "wholesale_avg"),
            ("Rosewood", "wood", 3500.0, "kg", "wholesale_avg"),
            ("Neem Wood", "wood", 800.0, "kg", "wholesale_avg"),
            ("Mango Wood", "wood", 600.0, "kg", "wholesale_avg"),
            ("Bamboo", "wood", 150.0, "kg", "wholesale_avg"),
            ("Channapatna Lacquer Wood", "wood", 1200.0, "kg", "wholesale_avg"),

            # Metals
            ("Brass", "metal", 550.0, "kg", "wholesale_avg"),
            ("Bell Metal (Bronze)", "metal", 800.0, "kg", "wholesale_avg"),
            ("Copper", "metal", 750.0, "kg", "wholesale_avg"),
            ("Silver", "metal", 75000.0, "kg", "wholesale_avg"),
            ("Iron (Wrought)", "metal", 80.0, "kg", "wholesale_avg"),
            ("Bidri Zinc Alloy", "metal", 400.0, "kg", "wholesale_avg"),

            # Textiles
            ("Cotton Fabric", "textile", 250.0, "meter", "wholesale_avg"),
            ("Silk Fabric", "textile", 1500.0, "meter", "wholesale_avg"),
            ("Pashmina Wool", "textile", 5000.0, "meter", "wholesale_avg"),
            ("Jute", "textile", 80.0, "meter", "wholesale_avg"),
            ("Cotton Thread", "textile", 200.0, "kg", "wholesale_avg"),
            ("Silk Thread", "textile", 3000.0, "kg", "wholesale_avg"),
            ("Zari (Gold Thread)", "textile", 8000.0, "kg", "wholesale_avg"),

            # Clays & Ceramics
            ("Terracotta Clay", "clay", 30.0, "kg", "wholesale_avg"),
            ("Blue Pottery Clay", "clay", 100.0, "kg", "wholesale_avg"),
            ("Kaolin (China Clay)", "clay", 50.0, "kg", "wholesale_avg"),

            # Dyes & Paints
            ("Natural Indigo Dye", "dye", 2000.0, "kg", "wholesale_avg"),
            ("Turmeric Dye", "dye", 200.0, "kg", "wholesale_avg"),
            ("Mineral Pigments", "dye", 500.0, "kg", "wholesale_avg"),
            ("Natural Lac Dye", "dye", 1200.0, "kg", "wholesale_avg"),
            ("Acrylic Paint", "dye", 300.0, "liter", "wholesale_avg"),

            # Fibers & Others
            ("Cane / Rattan", "fiber", 200.0, "kg", "wholesale_avg"),
            ("Palm Leaf", "fiber", 100.0, "kg", "wholesale_avg"),
            ("Coconut Shell", "fiber", 50.0, "kg", "wholesale_avg"),
            ("Papier-Mâché Base", "fiber", 150.0, "kg", "wholesale_avg"),
            ("Stone (Soapstone)", "stone", 120.0, "kg", "wholesale_avg"),
            ("Marble", "stone", 300.0, "kg", "wholesale_avg"),
            ("Conch Shell", "shell", 500.0, "piece", "wholesale_avg"),
            ("Horn (Buffalo)", "animal", 800.0, "kg", "wholesale_avg"),
            ("Bone (Camel)", "animal", 600.0, "kg", "wholesale_avg"),
            ("Leather", "animal", 400.0, "sq_ft", "wholesale_avg"),
        ]

        for mat in materials:
            await db.execute(
                """INSERT OR IGNORE INTO material_rates
                   (material_name, category, rate_per_unit, unit, source)
                   VALUES (?, ?, ?, ?, ?)""",
                mat
            )
        await db.commit()
    finally:
        await db.close()


async def seed_regional_wages():
    """Seed regional wage data based on government skilled artisan rates."""
    db = await get_db()
    try:
        # Based on approximate state minimum wages for skilled workers (2024-25)
        # Daily wage in ₹, hourly = daily / 8
        wages = [
            ("Rajasthan", "skilled", 350.0, 43.75),
            ("West Bengal", "skilled", 340.0, 42.50),
            ("Uttar Pradesh", "skilled", 360.0, 45.00),
            ("Gujarat", "skilled", 380.0, 47.50),
            ("Tamil Nadu", "skilled", 400.0, 50.00),
            ("Karnataka", "skilled", 410.0, 51.25),
            ("Andhra Pradesh", "skilled", 380.0, 47.50),
            ("Telangana", "skilled", 400.0, 50.00),
            ("Kerala", "skilled", 450.0, 56.25),
            ("Maharashtra", "skilled", 420.0, 52.50),
            ("Odisha", "skilled", 330.0, 41.25),
            ("Madhya Pradesh", "skilled", 350.0, 43.75),
            ("Jammu & Kashmir", "skilled", 370.0, 46.25),
            ("Assam", "skilled", 320.0, 40.00),
            ("Bihar", "skilled", 310.0, 38.75),
            ("Punjab", "skilled", 390.0, 48.75),
            ("Manipur", "skilled", 340.0, 42.50),
            ("Nagaland", "skilled", 330.0, 41.25),
            ("Chhattisgarh", "skilled", 340.0, 42.50),
            ("Jharkhand", "skilled", 330.0, 41.25),
            ("Default", "skilled", 370.0, 46.25),
        ]

        for wage in wages:
            await db.execute(
                """INSERT OR IGNORE INTO regional_wages
                   (state, skill_category, daily_wage, hourly_wage)
                   VALUES (?, ?, ?, ?)""",
                wage
            )
        await db.commit()
    finally:
        await db.close()


async def seed_craft_families():
    """Seed known Indian craft families for classification validation."""
    db = await get_db()
    try:
        crafts = [
            ("Madhubani Painting", "Mithila", "Bihar", 1, '["natural dyes","handmade paper","cotton cloth"]', "Traditional Bihar painting using natural dyes"),
            ("Warli Art", "Palghar", "Maharashtra", 1, '["rice paste","bamboo stick","cow dung wash"]', "Tribal geometric art from Maharashtra"),
            ("Dhokra Brass Casting", "Bastar", "Chhattisgarh", 1, '["brass","bell metal","beeswax","clay"]', "Lost-wax metal casting technique"),
            ("Bidriware", "Bidar", "Karnataka", 1, '["zinc alloy","silver inlay","copper"]', "Silver inlay on blackened zinc alloy"),
            ("Channapatna Toys", "Channapatna", "Karnataka", 1, '["ivory wood","lacquer","natural dyes"]', "Traditional lacquered wooden toys"),
            ("Pochampally Ikat", "Pochampally", "Telangana", 1, '["silk","cotton","natural dyes"]', "Resist dyeing double ikat weaving"),
            ("Banarasi Silk", "Varanasi", "Uttar Pradesh", 1, '["silk","zari","gold thread"]', "Opulent silk weaving with gold brocade"),
            ("Pashmina Shawl", "Kashmir", "Jammu & Kashmir", 1, '["pashmina wool","silk"]', "Fine cashmere hand-woven shawls"),
            ("Blue Pottery", "Jaipur", "Rajasthan", 1, '["quartz","glass","multani mitti","gum"]', "Turquoise glazed pottery without clay"),
            ("Terracotta Pottery", "Various", "West Bengal", 0, '["terracotta clay","natural pigments"]', "Traditional clay pottery and figurines"),
            ("Pattachitra", "Raghurajpur", "Odisha", 1, '["cotton cloth","natural colors","gum"]', "Cloth-based scroll painting"),
            ("Kalamkari", "Srikalahasti", "Andhra Pradesh", 1, '["cotton","natural dyes","bamboo pen"]', "Hand-painted or block-printed cotton textile"),
            ("Tanjore Painting", "Thanjavur", "Tamil Nadu", 1, '["gold foil","semi-precious stones","wood"]', "Gold-embossed paintings on wood"),
            ("Cane & Bamboo Craft", "Northeast", "Assam", 0, '["bamboo","cane","rattan"]', "Functional and decorative bamboo weaving"),
            ("Chikankari Embroidery", "Lucknow", "Uttar Pradesh", 1, '["cotton","muslin","silk thread"]', "Delicate white threadwork embroidery"),
            ("Aranmula Kannadi", "Aranmula", "Kerala", 1, '["copper","tin"]', "Traditional metal mirror casting"),
            ("Kondapalli Toys", "Kondapalli", "Andhra Pradesh", 1, '["softwood","natural dyes"]', "Lightweight hand-carved wooden toys"),
            ("Phulkari Embroidery", "Punjab", "Punjab", 1, '["cotton","silk thread"]', "Vibrant floral embroidery from Punjab"),
            ("Pipli Appliqué", "Pipli", "Odisha", 1, '["cotton fabric","mirrors","sequins"]', "Colorful appliqué work on fabric"),
            ("Sandstone Carving", "Rajasthan", "Rajasthan", 0, '["sandstone","marble"]', "Intricate stone carving and jali work"),
        ]

        for craft in crafts:
            await db.execute(
                """INSERT OR IGNORE INTO craft_families
                   (name, region, state, gi_tag, typical_materials, description)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                craft
            )
        await db.commit()
    finally:
        await db.close()


async def get_material_rate(material_name: str) -> dict | None:
    """Look up a material's wholesale rate. Uses comprehensive fuzzy & token matching."""
    db = await get_db()
    try:
        clean_name = material_name.strip()
        # 1. Exact match
        cursor = await db.execute(
            "SELECT * FROM material_rates WHERE LOWER(material_name) = LOWER(?)",
            (clean_name,)
        )
        row = await cursor.fetchone()
        if row:
            return dict(row)

        # 2. DB name contains input string
        cursor = await db.execute(
            "SELECT * FROM material_rates WHERE LOWER(material_name) LIKE LOWER(?)",
            (f"%{clean_name}%",)
        )
        row = await cursor.fetchone()
        if row:
            return dict(row)

        # 3. Input string contains DB name (e.g. "Dhokra Brass Alloy" contains "Brass")
        cursor = await db.execute(
            "SELECT * FROM material_rates WHERE LOWER(?) LIKE '%' || LOWER(material_name) || '%'",
            (clean_name,)
        )
        row = await cursor.fetchone()
        if row:
            return dict(row)

        # 4. Token-level matching (e.g. words like "brass", "terracotta", "silk", "wood", "clay")
        words = [w for w in clean_name.lower().split() if len(w) >= 3]
        for w in words:
            cursor = await db.execute(
                "SELECT * FROM material_rates WHERE LOWER(material_name) LIKE LOWER(?)",
                (f"%{w}%",)
            )
            row = await cursor.fetchone()
            if row:
                return dict(row)

        return None
    finally:
        await db.close()


async def get_all_material_rates() -> list[dict]:
    """Get all material rates."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM material_rates ORDER BY category, material_name")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def get_regional_wage(state: str = "Default") -> dict:
    """Get hourly wage for a region."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM regional_wages WHERE LOWER(state) = LOWER(?)",
            (state,)
        )
        row = await cursor.fetchone()
        if row:
            return dict(row)

        # Fall back to default
        cursor = await db.execute(
            "SELECT * FROM regional_wages WHERE state = 'Default'"
        )
        row = await cursor.fetchone()
        return dict(row) if row else {"hourly_wage": 46.25, "daily_wage": 370.0}
    finally:
        await db.close()


async def save_catalog_item(item_data: dict) -> int:
    """Save a confirmed catalog item and return its ID."""
    db = await get_db()
    try:
        def _safe_json(val, default):
            if val is None:
                return json.dumps(default)
            if isinstance(val, (dict, list)):
                return json.dumps(val)
            if isinstance(val, str):
                try:
                    # Validate it is valid JSON
                    json.loads(val)
                    return val
                except Exception:
                    return json.dumps(val)
            return json.dumps(default)

        cursor = await db.execute(
            """INSERT INTO catalog_items
               (title, craft_type, regional_style, description, craft_story,
                materials, workmanship_level, final_price, wholesale_floor,
                retail_recommended, premium_ceiling, pricing_breakdown,
                bullet_points, tags, full_view_path, detail_view_path, language)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item_data.get("title", ""),
                item_data.get("craft_type", ""),
                item_data.get("regional_style", ""),
                item_data.get("description", ""),
                item_data.get("craft_story", ""),
                _safe_json(item_data.get("materials"), []),
                int(item_data.get("workmanship_level", 3)),
                float(item_data.get("final_price", 0.0)),
                float(item_data.get("wholesale_floor", 0.0)),
                float(item_data.get("retail_recommended", 0.0)),
                float(item_data.get("premium_ceiling", 0.0)),
                _safe_json(item_data.get("pricing_breakdown"), {}),
                _safe_json(item_data.get("bullet_points"), []),
                _safe_json(item_data.get("tags"), []),
                item_data.get("full_view_path", ""),
                item_data.get("detail_view_path", ""),
                item_data.get("language", "en"),
            )
        )
        await db.commit()
        return cursor.lastrowid
    finally:
        await db.close()


async def get_catalog_items(limit: int = 50, offset: int = 0) -> list[dict]:
    """Get published catalog items."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM catalog_items ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = await cursor.fetchall()
        items = []
        for row in rows:
            item = dict(row)
            # Parse JSON fields
            for field in ["materials", "bullet_points", "tags"]:
                try:
                    item[field] = json.loads(item[field]) if item[field] else []
                except (json.JSONDecodeError, TypeError):
                    item[field] = []
            try:
                item["pricing_breakdown"] = json.loads(item["pricing_breakdown"]) if item["pricing_breakdown"] else {}
            except (json.JSONDecodeError, TypeError):
                item["pricing_breakdown"] = {}
            items.append(item)
        return items
    finally:
        await db.close()


async def get_catalog_item(item_id: int) -> dict | None:
    """Get a single catalog item by ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM catalog_items WHERE id = ?",
            (item_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        item = dict(row)
        for field in ["materials", "bullet_points", "tags"]:
            try:
                item[field] = json.loads(item[field]) if item[field] else []
            except (json.JSONDecodeError, TypeError):
                item[field] = []
        try:
            item["pricing_breakdown"] = json.loads(item["pricing_breakdown"]) if item["pricing_breakdown"] else {}
        except (json.JSONDecodeError, TypeError):
            item["pricing_breakdown"] = {}
        return item
    finally:
        await db.close()


async def delete_catalog_item(item_id: int) -> bool:
    """Delete a catalog item by ID from SQLite database."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM catalog_items WHERE id = ?",
            (item_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()

