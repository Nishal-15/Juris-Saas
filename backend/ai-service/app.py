from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

app = Flask(__name__)
CORS(app)

print("✅ AI Service: Starting on Port 8080...")

@app.route("/chat", methods=["POST"])
def chat():
    print("📩 Request received!")
    try:
        data = request.get_json()
        message = data.get("message", "")
        print(f"👤 Message: {message}")
        
        # Super simple response for testing
        return jsonify({"answer": f"Connection Successful! You said: {message}"})
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Using 8080 to avoid conflicts with common port 8000
    app.run(host="127.0.0.1", port=8080, debug=True)