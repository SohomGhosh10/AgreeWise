from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfminer.high_level
import os
import tempfile
import logging
from werkzeug.utils import secure_filename
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(_name_)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(_name_)

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

ALLOWED_EXTENSIONS = {'pdf'}

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_contract(text):
    risk_score = "low"
    crucial_points = []
    verdict = True

    risky_keywords = {
        "confidential": {"weight": 2, "message": "Confidentiality clause is too restrictive"},
        "non-compete": {"weight": 3, "message": "Non-compete clause is overly broad"},
        "termination": {"weight": 2, "message": "Termination terms are unclear"},
        "indemnification": {"weight": 3, "message": "Indemnification clause is too one-sided"},
        "liability": {"weight": 3, "message": "Liability clause is overly restrictive"},
        "arbitration": {"weight": 2, "message": "Arbitration clause limits legal recourse"},
    }

    positive_keywords = {
        "mutual": {"weight": -1, "message": "Mutual agreement detected"},
        "fair": {"weight": -1, "message": "Fair terms detected"},
        "reasonable": {"weight": -1, "message": "Reasonable terms detected"},
    }

    total_risk_score = 0

    for keyword, details in risky_keywords.items():
        if keyword in text.lower():
            crucial_points.append(details["message"])
            total_risk_score += details["weight"]

    for keyword, details in positive_keywords.items():
        if keyword in text.lower():
            crucial_points.append(details["message"])
            total_risk_score += details["weight"]

    sentences = text.split('.')
    for sentence in sentences:
        if len(sentence.split()) > 50:
            if any(keyword in sentence.lower() for keyword in risky_keywords):
                crucial_points.append(f"Long and complex sentence: {sentence[:100]}...")
                total_risk_score += 1

    if total_risk_score >= 5:
        risk_score = "high"
        verdict = False
    elif total_risk_score >= 3:
        risk_score = "medium"
        verdict = False
    else:
        risk_score = "low"
        verdict = True

    if not crucial_points:
        crucial_points.append("No major risks identified")

    return {
        "riskScore": risk_score,
        "crucialPoints": crucial_points,
        "verdict": verdict
    }

@app.route('/upload', methods=['POST'])
@limiter.limit("10 per minute")
def upload_pdf():
    try:
        if 'file' not in request.files:
            logger.error("No file part in the request")
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        
        if file.filename == '':
            logger.error("No file selected")
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(file.filename):
            logger.error(f"Invalid file type: {file.filename}")
            return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

        filename = secure_filename(file.filename)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name

        try:
            extracted_text = pdfminer.high_level.extract_text(temp_file_path)
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return jsonify({"error": "Failed to extract text from PDF"}), 500
        finally:
            os.remove(temp_file_path)

        analysis = analyze_contract(extracted_text)
        
        return jsonify({"text": extracted_text, "analysis": analysis})
    
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/analyze', methods=['POST'])
@limiter.limit("20 per minute")
def analyze_text():
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data in the request")
            return jsonify({"error": "No JSON data"}), 400

        contract_text = data.get("text", "")
        if not contract_text:
            logger.error("Empty contract text")
            return jsonify({"error": "Empty contract text"}), 400

        analysis = analyze_contract(contract_text)

        return jsonify({"analysis": analysis})
    
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    logger.warning(f"Rate limit exceeded: {e}")
    return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429

@app.errorhandler(413)
def request_too_large(e):
    logger.warning("Request payload too large")
    return jsonify({"error": "Request payload too large. Maximum size is 10MB."}), 413

if _name_ == '_main_':
    app.run(host='0.0.0.0', port=5000)