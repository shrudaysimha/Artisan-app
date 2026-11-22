from flask import Flask, request, jsonify, render_template
import uuid

from database import (
    create_table,
    add_product,
    get_product,
    update_product
)

from qr_generator import generate_qr


app = Flask(__name__)

create_table()


# Change this later when your backend is deployed
BASE_URL = "http://192.168.43.241:5000"

@app.route("/")
def home():
    return "Dynamic QR Module is Running"


@app.route("/api/products", methods=["POST"])
def create_product():

    data = request.get_json()

    product_id = "PRD-" + uuid.uuid4().hex[:8].upper()

    product = {
        "product_id": product_id,
        "product_name": data.get("product_name"),
        "artisan_name": data.get("artisan_name"),
        "craft_type": data.get("craft_type"),
        "material": data.get("material"),
        "origin": data.get("origin"),
        "price": data.get("price")
    }

    add_product(product)

    product_url = generate_qr(
        product_id,
        BASE_URL
    )

    return jsonify({
        "message": "Product created successfully",
        "product_id": product_id,
        "product_url": product_url,
        "qr_image": f"/static/qr/{product_id}.png"
    }), 201


@app.route("/api/products/<product_id>", methods=["GET"])
def api_get_product(product_id):

    product = get_product(product_id)

    if product is None:
        return jsonify({
            "error": "Product not found"
        }), 404

    return jsonify(dict(product))


@app.route("/api/products/<product_id>", methods=["PUT"])
def api_update_product(product_id):

    existing_product = get_product(product_id)

    if existing_product is None:
        return jsonify({
            "error": "Product not found"
        }), 404

    data = request.get_json()

    product = {
        "product_name": data.get(
            "product_name",
            existing_product["product_name"]
        ),

        "artisan_name": data.get(
            "artisan_name",
            existing_product["artisan_name"]
        ),

        "craft_type": data.get(
            "craft_type",
            existing_product["craft_type"]
        ),

        "material": data.get(
            "material",
            existing_product["material"]
        ),

        "origin": data.get(
            "origin",
            existing_product["origin"]
        ),

        "price": data.get(
            "price",
            existing_product["price"]
        )
    }

    update_product(product_id, product)

    return jsonify({
        "message": "Product updated successfully",
        "product_id": product_id
    })


@app.route("/product/<product_id>")
def product_page(product_id):

    product = get_product(product_id)

    if product is None:
        return "Product not found", 404

    return render_template(
        "product.html",
        product=product
    )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )