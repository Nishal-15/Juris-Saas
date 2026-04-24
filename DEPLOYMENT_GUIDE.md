# 🚀 JurisBot 2.0 Deployment Guide

To host the JurisBot 2.0 platform professionally, we will use **Vercel** for the frontends (Client & Lawyer) and **Render** for the backends (Main API & AI Service).

---

## 1. Prepare for GitHub
You should upload your entire `Juris-Saas` folder to a **Private** GitHub repository.

### ✅ Mandatory Files to Include:
- **Root**: `README.md`, `.gitignore`
- **Frontend**: All files inside `frontend/` (excluding `node_modules`).
- **Backend**: All files inside `backend/` (excluding `node_modules`).
- **AI Service**: `app.py`, `requirements.txt` inside `backend/ai-service/`.
- **Lawyer Frontend**: All files inside `lawyer-frontend/`.

### ❌ Files to EXCLUDE (Ignore):
- `.env` files (These contain your secrets).
- `node_modules/` folders.
- `venv/` or Python virtual environments.
- Large data files like `faiss.index` (unless using Git LFS).

---

## 2. Frontend Deployment (Vercel)
Vercel is best for the React/Vite frontends.

### Steps for `frontend` and `lawyer-frontend`:
1. Login to [Vercel](https://vercel.com) and click **Add New Project**.
2. Connect your GitHub repo.
3. **Important**: Change the **Root Directory** to `frontend` (for the main site) or `lawyer-frontend`.
4. **Framework Preset**: Vite.
5. **Environment Variables**:
   - `VITE_API_URL`: Your Render Backend URL (e.g., `https://jurisbot-api.onrender.com/api`).
   - `VITE_AI_URL`: Your Render AI Service URL (e.g., `https://jurisbot-ai.onrender.com`).

---

## 3. Main Backend Deployment (Render)
Render is best for Node.js APIs.

### Steps for `backend`:
1. Login to [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repo.
3. **Root Directory**: `backend`.
4. **Build Command**: `npm install`.
5. **Start Command**: `node server.js`.
6. **Environment Variables**:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A strong random string.
   - `PORT`: 5000.

---

## 4. AI Service Deployment (Render)
The AI service runs on Python/Flask.

### Steps for `backend/ai-service`:
1. Click **New > Web Service** on Render.
2. Connect your repo.
3. **Root Directory**: `backend/ai-service`.
4. **Environment**: Python 3.
5. **Build Command**: `pip install -r requirements.txt`.
6. **Start Command**: `gunicorn app:app` (Install `gunicorn` in requirements first).
7. **Environment Variables**:
   - `PINECONE_API_KEY`: Your key.
   - `PINECONE_INDEX_NAME`: Your index name.
   - `LLM_MODEL`: e.g., `mistral`.

---

## 5. Security Checklist
- [ ] Ensure all API calls in the Frontend use `process.env.VITE_API_URL` instead of `localhost`.
- [ ] Update CORS settings in `backend/server.js` and `ai-service/app.py` to allow your Vercel domains.
- [ ] Set your MongoDB Atlas Network Access to allow "All IP Addresses" (0.0.0.0/0) so Render can connect.
