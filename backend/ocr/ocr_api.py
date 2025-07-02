import re
import os
import sys
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image

# Import pytesseract with error handling
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    
    # Common Tesseract installation paths
    common_tesseract_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'/usr/bin/tesseract',
        r'/usr/local/bin/tesseract'
    ]
    
    # Try to set Tesseract path automatically
    tesseract_found = False
    for path in common_tesseract_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            tesseract_found = True
            print(f"Tesseract found at: {path}")
            break
    
    if not tesseract_found:
        print("Tesseract not found in common locations. You may need to set pytesseract.pytesseract.tesseract_cmd manually.")
        
    # Manual override - if you know your Tesseract path, uncomment and modify the line below
    # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
except ImportError:
    TESSERACT_AVAILABLE = False
    print("Warning: pytesseract is not installed. OCR functionality will be limited to demo mode.")
except Exception as e:
    TESSERACT_AVAILABLE = False
    print(f"Warning: Error initializing pytesseract: {e}. OCR functionality will be limited to demo mode.")

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "../uploads"
TEXT_FOLDER = "../extracted_texts"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEXT_FOLDER, exist_ok=True)

@app.route('/extract-text', methods=['POST'])
def extract_text():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # Generate timestamp for file naming
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    text_filename = f"text_{timestamp}.txt"
    text_file_path = os.path.join(TEXT_FOLDER, text_filename)
    
    # Process image with OCR if available
    if TESSERACT_AVAILABLE:
        try:
            image = Image.open(file_path)
            raw_text = pytesseract.image_to_string(image)
            lines = raw_text.strip().split("\n")
            
            # Save extracted text to file
            with open(text_file_path, "w", encoding="utf-8") as f:
                f.write(raw_text)
            
            # Parse text for structured data
            pattern = r"^(\d+)\s+(.+?)\s+(\d+)\s+(\d{10,13})\s+([\d.]+)\s+([\d.]+)$"
            data = []
            
            for line in lines:
                line = line.strip()
                match = re.match(pattern, line)
                if match:
                    sn, name, qty, barcode, cost, sell = match.groups()
                    item = {
                        "sn": int(sn),
                        "name": name.strip(),
                        "quantity": int(qty),
                        "barcode": barcode,
                        "cost_price": float(cost),
                        "selling_price": float(sell)
                    }
                    data.append(item)
                    
            return jsonify({
                "extracted_text": raw_text,
                "items": data,
                "saved_file": text_filename,
                "ocr_status": "success"
            })
            
        except Exception as e:
            print(f"OCR Error: {e}")
            # Fall back to demo mode on error
            return generate_demo_response(file_path, text_file_path, text_filename)
    else:
        # Tesseract not available, use demo mode
        return generate_demo_response(file_path, text_file_path, text_filename)

# Helper function to generate demo response when OCR isn't available
def generate_demo_response(file_path, text_file_path, text_filename):
    """Generate demo OCR data when actual OCR is not available"""
    # Save a placeholder file
    with open(text_file_path, "w", encoding="utf-8") as f:
        f.write("DEMO MODE - Tesseract OCR not available\n\n" + 
                "1 Coca Cola 500ml 24 8901234567890 15.00 25.00\n" +
                "2 Pepsi Cola 330ml 30 8901234567891 12.50 20.00\n" +
                "3 Mountain Dew 500ml 18 8901234567892 14.00 23.50\n")
    
    # Generate sample items that would have been extracted
    demo_items = [
        {
            "sn": 1,
            "name": "Coca Cola 500ml",
            "quantity": 24,
            "barcode": "8901234567890",
            "cost_price": 15.0,
            "selling_price": 25.0
        },
        {
            "sn": 2,
            "name": "Pepsi Cola 330ml",
            "quantity": 30,
            "barcode": "8901234567891",
            "cost_price": 12.5,
            "selling_price": 20.0
        },
        {
            "sn": 3,
            "name": "Mountain Dew 500ml",
            "quantity": 18,
            "barcode": "8901234567892",
            "cost_price": 14.0,
            "selling_price": 23.5
        }
    ]
    
    return jsonify({
        "extracted_text": "DEMO MODE - Tesseract OCR not available\n\n1 Coca Cola 500ml 24 8901234567890 15.00 25.00\n2 Pepsi Cola 330ml 30 8901234567891 12.50 20.00\n3 Mountain Dew 500ml 18 8901234567892 14.00 23.50",
        "items": demo_items,
        "saved_file": text_filename,
        "ocr_status": "demo_mode"
    })

@app.route('/save-items', methods=['POST'])
def save_items():
    data = request.get_json()
    items = data.get('items', [])
    
    if not items:
        return jsonify({'error': 'No items received'}), 400

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"confirmed_items_{timestamp}.json"
    file_path = os.path.join(TEXT_FOLDER, filename)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2)

    return jsonify({'saved_file': filename})

if __name__ == '__main__':
    print("Starting OCR API server...")
    print("OCR Status:", "AVAILABLE" if TESSERACT_AVAILABLE else "DEMO MODE (Tesseract not found)")
    print("Server will be accessible at: http://127.0.0.1:5000/")
    # Allow connections from other hosts (0.0.0.0) and use port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
