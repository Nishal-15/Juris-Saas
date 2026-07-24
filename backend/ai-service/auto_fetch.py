import os, sys, re, time, argparse
import requests, fitz
import numpy as np, faiss
from pymongo import MongoClient
from datetime import datetime
from sentence_transformers import (
  SentenceTransformer
)

MONGO_URI  = os.getenv(
  "MONGO_URI",
  "mongodb://127.0.0.1:27017"
)
DB_NAME    = "jurisbot-Saas"
COL_NAME   = "law_sections"
SYNC_COL   = "lawsyncs"
LAWS_DIR   = os.path.join(
  os.path.dirname(__file__),
  "laws", "auto"
)
FAISS_FILE = os.path.join(
  os.path.dirname(__file__),
  "faiss.index"
)
META_FILE  = os.path.join(
  os.path.dirname(__file__),
  "meta.npy"
)

IK_KEY = os.getenv(
  "INDIAN_KANOON_API_KEY", ""
)

client   = MongoClient(MONGO_URI)
db       = client[DB_NAME]
col      = db[COL_NAME]
sync_col = db[SYNC_COL]

parser = argparse.ArgumentParser()
parser.add_argument(
  "--source", default="all",
  choices=[
    "all", "IndianKanoon",
    "IndiaCode", "Gazette"
  ]
)
parser.add_argument(
  "--sync-id", default=None
)
args = parser.parse_args()

os.makedirs(LAWS_DIR, exist_ok=True)

sections_added  = 0
documents_added = 0
errors          = []

def ingest_text(text, source,
  title, year="Unknown"):
  global sections_added
  parts = re.split(
    r'(?i)(Section\s+\d+[A-Z]?\.?|'
    r'Sec\.\s+\d+|Article\s+\d+)',
    text
  )
  batch = []
  for i in range(1, len(parts), 2):
    header  = parts[i].strip()
    content = (
      parts[i + 1].strip()
      if i + 1 < len(parts) else ""
    )
    if len(content) < 20:
      continue
    doc_id = f"{source}_{title}_{header}"
    if col.find_one({"doc_id": doc_id}):
      continue
    batch.append({
      "doc_id":    doc_id,
      "file_name": title,
      "section":   header,
      "content":   content,
      "act":       title,
      "year":      str(year),
      "heading":   header,
      "source":    source,
      "indexed_at":
        datetime.utcnow().isoformat(),
      "type": "statute"
    })
  if batch:
    col.insert_many(batch)
    sections_added += len(batch)
    print(
      f"  ✅ {len(batch)} sections: {title}",
      flush=True
    )
  elif len(text) > 100:
    doc_id = f"{source}_{title}_full"
    if not col.find_one(
      {"doc_id": doc_id}
    ):
      col.insert_one({
        "doc_id":    doc_id,
        "file_name": title,
        "content":   text[:50000],
        "act":       title,
        "year":      str(year),
        "heading":   title,
        "source":    source,
        "indexed_at":
          datetime.utcnow().isoformat(),
        "type": "full_document"
      })
      sections_added += 1

def fetch_indian_kanoon():
  global documents_added
  print(
    "\n📚 [IndianKanoon] Starting...",
    flush=True
  )
  if not IK_KEY:
    print(
      "  ⚠ INDIAN_KANOON_API_KEY not set.\n"
      "  Get free key: indiankanoon.org/api/",
      flush=True
    )
    return
  QUERIES = [
    "Supreme Court 2024 judgment",
    "Supreme Court 2025 judgment",
    "Mediation Act 2023",
    "BNS 2023",
    "BNSS 2023",
    "BSA 2023",
    "High Court 2024 landmark"
  ]
  headers = {
    "Authorization": f"Token {IK_KEY}"
  }
  for query in QUERIES:
    try:
      resp = requests.get(
        "https://api.indiankanoon.org"
        "/search/",
        params={
          "formInput": query,
          "pagenum":   0
        },
        headers=headers,
        timeout=15
      )
      if resp.status_code != 200:
        continue
      docs = resp.json().get("docs", [])
      print(
        f"  🔍 {query}: "
        f"{len(docs)} results",
        flush=True
      )
      for doc in docs[:5]:
        doc_id = str(doc.get("tid", ""))
        title  = doc.get(
          "title", "Unknown Judgment"
        )
        year   = doc.get(
          "publishdate", "2024"
        )[:4]
        if col.find_one({
          "doc_id":
            f"IndianKanoon_{doc_id}"
        }):
          continue
        try:
          dr = requests.get(
            f"https://api.indiankanoon.org"
            f"/doc/{doc_id}/",
            headers=headers,
            timeout=15
          )
          if dr.status_code == 200:
            txt = dr.json().get("doc", "")
            if txt and len(txt) > 200:
              ingest_text(
                txt,
                "IndianKanoon",
                title,
                year
              )
              documents_added += 1
          time.sleep(0.5)
        except Exception as e:
          errors.append(str(e))
    except Exception as e:
      errors.append(str(e))
  print(
    f"[IndianKanoon] Done. "
    f"{documents_added} docs.",
    flush=True
  )

def fetch_india_code():
  global documents_added
  print(
    "\n📜 [IndiaCode] Starting...",
    flush=True
  )
  ACTS = [
    ("Bharatiya Nyaya Sanhita 2023",
     "2023", "202345"),
    ("Bharatiya Nagarik Suraksha Sanhita",
     "2023", "202346"),
    ("Bharatiya Sakshya Adhiniyam 2023",
     "2023", "202347"),
    ("Mediation Act 2023",
     "2023", "202332"),
    ("Digital Personal Data Protection",
     "2023", "202362"),
    ("Telecommunications Act 2023",
     "2023", "202344"),
    ("Consumer Protection Act 2019",
     "2019", "201935"),
    ("Insolvency Bankruptcy Code 2016",
     "2016", "201631"),
    ("Information Technology Act 2000",
     "2000", "200021"),
    ("Protection Women DV Act 2005",
     "2005", "200543"),
    ("GST Act 2017",
     "2017", "201712"),
  ]
  for name, year, act_id in ACTS:
    if col.find_one({
      "doc_id": f"IndiaCode_{act_id}"
    }):
      print(
        f"  ⚠ Already indexed: {name}",
        flush=True
      )
      continue
    try:
      print(
        f"  📥 Fetching: {name}",
        flush=True
      )
      pdf_url = (
        f"https://www.indiacode.nic.in"
        f"/bitstream/123456789/{act_id}"
        f"/1/A{year}-{act_id[-2:]}.pdf"
      )
      pr = requests.get(
        pdf_url,
        timeout=20,
        headers={
          "User-Agent":
            "JurisBot-LegalSync/1.0"
        }
      )
      if pr.status_code == 200:
        pdf_path = os.path.join(
          LAWS_DIR,
          f"{act_id}_{name[:20]}.pdf"
        )
        with open(pdf_path, "wb") as f:
          f.write(pr.content)
        try:
          doc  = fitz.open(pdf_path)
          text = "".join(
            p.get_text() for p in doc
          )
          doc.close()
          if text.strip():
            ingest_text(
              text,
              "IndiaCode",
              name,
              year
            )
            documents_added += 1
          os.remove(pdf_path)
        except Exception as e:
          errors.append(str(e))
      time.sleep(1)
    except Exception as e:
      errors.append(str(e))
  print(
    f"[IndiaCode] Done. "
    f"{documents_added} docs.",
    flush=True
  )

def fetch_gazette():
  global documents_added
  print(
    "\n📰 [Gazette] Starting...",
    flush=True
  )
  try:
    import xml.etree.ElementTree as ET
    resp = requests.get(
      "https://egazette.nic.in"
      "/WriteReadData/rss.xml",
      timeout=15,
      headers={
        "User-Agent":
          "JurisBot-LegalSync/1.0"
      }
    )
    if resp.status_code != 200:
      return
    root  = ET.fromstring(resp.text)
    items = root.findall(".//item")
    print(
      f"  Found {len(items)} items",
      flush=True
    )
    for item in items[:10]:
      title = item.findtext(
        "title", "Unknown"
      )
      link  = item.findtext("link", "")
      date  = item.findtext("pubDate", "")
      year  = (
        date[-4:]
        if len(date) >= 4 else "2025"
      )
      if not link:
        continue
      if col.find_one({
        "doc_id":
          f"Gazette_{link[-20:]}"
      }):
        continue
      try:
        pr = requests.get(
          link,
          timeout=15,
          headers={
            "User-Agent":
              "JurisBot-LegalSync/1.0"
          }
        )
        ct = pr.headers.get(
          "content-type", ""
        ).lower()
        if (
          pr.status_code == 200 and
          "pdf" in ct
        ):
          pp = os.path.join(
            LAWS_DIR,
            f"gazette_{int(time.time())}"
            f".pdf"
          )
          with open(pp, "wb") as f:
            f.write(pr.content)
          doc  = fitz.open(pp)
          text = "".join(
            p.get_text() for p in doc
          )
          doc.close()
          os.remove(pp)
          if len(text) > 200:
            ingest_text(
              text,
              "Gazette",
              title,
              year
            )
            documents_added += 1
        time.sleep(0.5)
      except Exception as e:
        errors.append(str(e))
  except Exception as e:
    errors.append(str(e))
  print("[Gazette] Done.", flush=True)

def rebuild_faiss():
  print(
    "\n🔄 [FAISS] Rebuilding...",
    flush=True
  )
  try:
    model = SentenceTransformer(
      "all-MiniLM-L6-v2"
    )
    docs = list(col.find({}, {
      "content": 1,
      "act":     1,
      "year":    1,
      "heading": 1,
      "source":  1
    }))
    if not docs:
      print(
        "  ⚠ No docs in DB.",
        flush=True
      )
      return
    print(
      f"  Encoding {len(docs)} sections...",
      flush=True
    )
    texts = [
      d.get("content", "")[:1000]
      for d in docs
    ]
    meta = [{
      "act":
        d.get("act",     "Unknown"),
      "year":
        d.get("year",    "Unknown"),
      "heading":
        d.get("heading", "Unknown"),
      "content":
        d.get("content", "")[:500],
      "source":
        d.get("source",  "Unknown")
    } for d in docs]
    embs = model.encode(
      texts,
      batch_size=64,
      show_progress_bar=True
    ).astype("float32")
    idx = faiss.IndexFlatL2(embs.shape[1])
    idx.add(embs)
    faiss.write_index(idx, FAISS_FILE)
    np.save(
      META_FILE,
      np.array(meta, dtype=object)
    )
    print(
      f"  ✅ FAISS rebuilt: "
      f"{len(docs)} vectors",
      flush=True
    )
  except Exception as e:
    print(
      f"  ❌ FAISS error: {e}",
      flush=True
    )
    errors.append(str(e))

def update_sync_record(sync_id, status):
  if not sync_id:
    return
  try:
    from bson import ObjectId
    sync_col.update_one(
      {"_id": ObjectId(sync_id)},
      {"$set": {
        "status":
          status,
        "sectionsAdded":
          sections_added,
        "documentsAdded":
          documents_added,
        "errorMessage":
          "; ".join(errors[:3])
          if errors else None,
        "syncedAt":
          datetime.utcnow()
      }}
    )
  except Exception as e:
    print(
      f"❌ Sync record update: {e}",
      flush=True
    )

def main():
  print(
    "\n" + "=" * 50 +
    "\n⚖️  JurisBot Auto Law Sync" +
    f"\n   Source: {args.source}" +
    f"\n   Time:   {datetime.utcnow()}" +
    "\n" + "=" * 50,
    flush=True
  )
  try:
    if args.source in (
      "all", "IndianKanoon"
    ):
      fetch_indian_kanoon()
    if args.source in (
      "all", "IndiaCode"
    ):
      fetch_india_code()
    if args.source in (
      "all", "Gazette"
    ):
      fetch_gazette()

    if sections_added > 0:
      rebuild_faiss()
    else:
      print(
        "\n⚠ No new sections. "
        "FAISS rebuild skipped.",
        flush=True
      )

    status = (
      "failed"  if len(errors) > 3 else
      "partial" if errors        else
      "success"
    )
    update_sync_record(
      args.sync_id, status
    )

    print(
      f"\n✅ Sync Complete"
      f"\n   Docs:     {documents_added}"
      f"\n   Sections: {sections_added}"
      f"\n   Errors:   {len(errors)}"
      f"\n   Status:   {status}",
      flush=True
    )
    sys.exit(
      0 if status != "failed" else 1
    )
  except Exception as e:
    print(
      f"\n❌ CRITICAL: {e}",
      flush=True
    )
    update_sync_record(
      args.sync_id, "failed"
    )
    sys.exit(1)

if __name__ == "__main__":
  main()
