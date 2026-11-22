# Dynamic QR Module

## How to Run

1. Open this folder in VS Code.

2. Open the terminal and create a virtual environment:

   python -m venv venv

3. Activate it:

   venv\Scripts\activate.bat

4. Install the required packages:

   pip install -r requirements.txt

5. Run the application:

   python app.py

6. Open in browser:

   http://127.0.0.1:5000


## How to Test

Use Thunder Client.

### Create a Product

POST:

http://127.0.0.1:5000/api/products

Body → JSON:

{
    "product_name": "Ilkal Saree",
    "artisan_name": "Lakshmi",
    "craft_type": "Handloom",
    "material": "Cotton and Silk",
    "origin": "Bagalkot, Karnataka",
    "price": 2500
}

After sending, a Product ID and QR URL will be generated.

The QR image will be saved inside:

static/qr/


### Update Product

Use the Product ID received above.

PUT:

http://127.0.0.1:5000/api/products/<product_id>

Example body:

{
    "price": 3000
}

The same QR code will now show the updated price.

## For Final Integration

The current project uses SQLite only for testing.

During integration with the main application, connect this module to the
team's existing database and replace the local BASE_URL in app.py with the
deployed backend URL.

The main API endpoints are:

POST /api/products
GET  /api/products/<product_id>
PUT  /api/products/<product_id>