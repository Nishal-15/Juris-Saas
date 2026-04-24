import os
import numpy as np
import faiss
from pinecone import Pinecone, ServerlessSpec
from tqdm import tqdm

# =========================
# CONFIG
# =========================
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "jurisbot-index")

FAISS_INDEX_FILE = "faiss.index"
META_FILE = "meta.npy"

# =========================
# INIT PINECONE
# =========================
pc = Pinecone(api_key=PINECONE_API_KEY)

# Wait for index if not ready
if PINECONE_INDEX_NAME not in pc.list_indexes().names():
    print(f"Index {PINECONE_INDEX_NAME} not found. Please create it first on Pinecone dashboard.")
    exit()

index_handle = pc.Index(PINECONE_INDEX_NAME)

# =========================
# LOAD LOCAL DATA
# =========================
print("⚡ Loading local FAISS data...")
if not os.path.exists(FAISS_INDEX_FILE) or not os.path.exists(META_FILE):
    print("❌ Files not found. Run your local ingestion first!")
    exit()

index = faiss.read_index(FAISS_INDEX_FILE)
meta = np.load(META_FILE, allow_pickle=True)

# =========================
# SYNC TO CLOUD (UPSERT)
# =========================
print(f"🚀 Syncing {len(meta)} vector chunks to Pinecone Cloud...")

batch_size = 50  # Stable batch size for free tier

for i in tqdm(range(0, len(meta), batch_size)):
    batch_end = min(i + batch_size, len(meta))
    
    # Extract IDs, Vectors, and Metadata
    ids = [str(j) for j in range(i, batch_end)]
    
    # Get vectors from FAISS index (reconstructing them)
    vectors = []
    for j in range(i, batch_end):
        vectors.append(index.reconstruct(j).tolist())
    
    # Format metadata for Pinecone
    metadata_batch = []
    for j in range(i, batch_end):
        m = meta[j]
        # Pinecone metadata must be clean (strings/numbers only)
        clean_meta = {
            "act": str(m.get("act", "Unknown")),
            "year": str(m.get("year", "Unknown")),
            "heading": str(m.get("heading", "Unknown")),
            "content": str(m.get("content", ""))[:8000] # Safe limit
        }
        metadata_batch.append(clean_meta)

    # Upsert to Cloud
    upsert_data = []
    for id_val, vec, meta_val in zip(ids, vectors, metadata_batch):
        upsert_data.append({"id": id_val, "values": vec, "metadata": meta_val})
        
    index_handle.upsert(vectors=upsert_data)

print("\n" + "="*50)
print("✅ SYNC COMPLETE! Your laws are now in the Global Cloud.")
print("="*50)
print("You can now safely DELETE faiss.index and meta.npy to save 1GB of space!")
