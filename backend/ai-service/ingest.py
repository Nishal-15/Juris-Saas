import os
import fitz
from pymongo import MongoClient

# =========================
# MONGODB CONNECTION
# =========================
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = "jurisbot-Saas"
COLLECTION_NAME = "law_sections"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# =========================
# DYNAMIC ROOT FOLDER
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_ROOT = os.path.join(BASE_DIR, "laws")

def ingest():
    print(f"🔄 Starting JurisBot AI Sync: {PDF_ROOT}")
    
    if not os.path.exists(PDF_ROOT):
        os.makedirs(PDF_ROOT)

    for root, dirs, files in os.walk(PDF_ROOT):
        for file in files:
            if file.lower().endswith(".pdf"):
                full_path = os.path.join(root, file)

                # 💡 ENHANCED: Check if already indexed (Simple name check for stability)
                if collection.find_one({"file_name": file}):
                    print(f"⚠ Re-indexing: {file}...")
                    collection.delete_many({"file_name": file})

                print(f"📄 Processing legal knowledge: {file}")

                try:
                    import re
                    doc = fitz.open(full_path)
                    content = ""
                    for page in doc:
                        content += page.get_text()

                    # ⚖️ Granular Section Splitting (National Legal Standard)
                    # Splitting by common legal patterns like "Section 1.", "Sec 5.", "Article 21."
                    sections = re.split(r'(?i)(Section\s+\d+|Sec\.\s+\d+|Article\s+\d+)', content)
                    
                    batch = []
                    for i in range(1, len(sections), 2):
                        section_header = sections[i].strip()
                        section_content = sections[i+1].strip() if i+1 < len(sections) else ""
                        
                        batch.append({
                            "file_name": file,
                            "section": section_header,
                            "content": section_content,
                            "indexed_at": os.path.getmtime(full_path),
                            "type": "statute"
                        })

                    if batch:
                        collection.insert_many(batch)
                        print(f"✅ Indexed {len(batch)} sections from {file}")
                    else:
                        # Fallback if no sections detected
                        collection.insert_one({
                            "file_name": file,
                            "content": content,
                            "indexed_at": os.path.getmtime(full_path),
                            "type": "full_document"
                        })

                except Exception as e:
                    print(f"❌ Failed to parse {file}: {e}")

    print("🎯 JurisBot AI Sync: Complete.")

if __name__ == "__main__":
    ingest()
