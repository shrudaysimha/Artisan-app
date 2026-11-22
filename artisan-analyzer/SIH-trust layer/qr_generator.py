import qrcode
import os


def generate_qr(product_id, base_url):
    product_url = f"{base_url}/product/{product_id}"

    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )

    qr.add_data(product_url)
    qr.make(fit=True)

    image = qr.make_image()

    folder = os.path.join("static", "qr")

    os.makedirs(folder, exist_ok=True)

    file_path = os.path.join(
        folder,
        f"{product_id}.png"
    )

    image.save(file_path)

    return product_url