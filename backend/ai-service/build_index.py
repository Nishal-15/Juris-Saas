import numpy as np
import faiss
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import pickle

client = MongoClient("mongodb://127.0.0.1:27017")
db = client["jurisbot-Saas"]
col = db["law_sections"]

model = SentenceTransformer("all-MiniLM-L6-v2")

texts = []
meta = []

print("Loading sections from DB...")

for doc in col.find():
    texts.append(doc["content"])
    meta.append({
        "heading": doc["heading"],
        "act": doc["act"],
        "year": doc["year"]
    })

print("Encoding embeddings...")
embeddings = model.encode(texts, batch_size=64, show_progress_bar=True)

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(np.array(embeddings))

faiss.write_index(index, "law.index")

with open("law_meta.pkl","wb") as f:
    pickle.dump(meta,f)

print("✅ FAISS index saved")
