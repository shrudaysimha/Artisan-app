import sqlite3

DB_NAME = "products.db"


def get_connection():
    connection = sqlite3.connect(DB_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def create_table():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS products (
            product_id TEXT PRIMARY KEY,
            product_name TEXT NOT NULL,
            artisan_name TEXT NOT NULL,
            craft_type TEXT,
            material TEXT,
            origin TEXT,
            price REAL
        )
    """)

    connection.commit()
    connection.close()


def add_product(product):
    connection = get_connection()

    connection.execute("""
        INSERT INTO products
        (
            product_id,
            product_name,
            artisan_name,
            craft_type,
            material,
            origin,
            price
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        product["product_id"],
        product["product_name"],
        product["artisan_name"],
        product["craft_type"],
        product["material"],
        product["origin"],
        product["price"]
    ))

    connection.commit()
    connection.close()


def get_product(product_id):
    connection = get_connection()

    product = connection.execute(
        "SELECT * FROM products WHERE product_id = ?",
        (product_id,)
    ).fetchone()

    connection.close()

    return product


def update_product(product_id, product):
    connection = get_connection()

    connection.execute("""
        UPDATE products
        SET
            product_name = ?,
            artisan_name = ?,
            craft_type = ?,
            material = ?,
            origin = ?,
            price = ?
        WHERE product_id = ?
    """, (
        product["product_name"],
        product["artisan_name"],
        product["craft_type"],
        product["material"],
        product["origin"],
        product["price"],
        product_id
    ))

    connection.commit()
    connection.close()