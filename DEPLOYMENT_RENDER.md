# 🚀 Deploying to Render (Frontend & Backend)

This repository is fully configured for deployment on [Render](https://render.com). You can deploy both the **FastAPI Backend** and the **React + Vite Frontend** either automatically using Render Blueprints (`render.yaml`) or manually through the Render Dashboard.

---

## ⚡ Method 1: Automatic 1-Click Deployment (Render Blueprint) - Recommended

Render's Blueprint feature reads the [`render.yaml`](./render.yaml) file at the root of the repository and automatically provisions both services together with zero guesswork.

### Steps:
1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure Render deployment for frontend and backend"
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click the **"New +"** button in the top navigation bar.
4. Select **"Blueprint"**.
5. Connect your GitHub repository (`cognizantPlanningProcurement`).
6. Render will parse `render.yaml` and show:
   - **`trendwear-sop-backend`** (Python Web Service)
   - **`trendwear-sop-frontend`** (Static Site)
7. Click **"Apply"**.
8. Render will build and deploy both services automatically!
   - The frontend's `VITE_API_BASE_URL` will be automatically populated with the backend's live Render URL.
   - Once both deployments say **"Live"**, open your frontend URL to use the application.

---

## 🛠️ Method 2: Manual Dashboard Setup

If you prefer to configure the services manually on Render's web dashboard:

### Step 1: Deploy the Backend Web Service
1. In Render Dashboard, click **"New +"** → **"Web Service"**.
2. Connect your repository.
3. Configure the following settings:
   - **Name**: `trendwear-sop-backend` (or your choice)
   - **Region**: Choose the region closest to you (e.g., *Oregon* or *Frankfurt*)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
4. Expand **"Advanced"** and add an Environment Variable:
   - `PYTHON_VERSION` = `3.11.9`
   - `ALLOWED_ORIGINS` = `*`
   - Health Check Path: `/api/health`
5. Click **"Create Web Service"**.
6. Wait for deployment to finish and copy your backend URL (e.g. `https://trendwear-sop-backend.onrender.com`).

---

### Step 2: Deploy the Frontend Static Site
1. In Render Dashboard, click **"New +"** → **"Static Site"**.
2. Connect the same repository.
3. Configure the following settings:
   - **Name**: `trendwear-sop-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Publish Directory**: `dist`
4. Add an Environment Variable:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://trendwear-sop-backend.onrender.com` *(paste your backend URL from Step 1)*
5. Configure SPA Routing (Prevents 404 on page refreshes):
   - Scroll down to **"Redirects / Rewrites"**.
   - Click **"Add Rule"**:
     - **Source**: `/*`
     - **Action**: `Rewrite`
     - **Destination**: `/index.html`
6. Click **"Create Static Site"**.

---

## 📦 Method 3: Single-Service Combined Deployment (Optional)

If you wish to host both frontend and backend inside a **single** Render Web Service to conserve free tier hours:

1. Click **"New +"** → **"Web Service"**.
2. Configure:
   - **Root Directory**: Leave blank (repository root)
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     cd frontend && npm install --include=dev && npm run build && cd ../backend && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
3. The FastAPI server in `backend/main.py` is pre-configured to detect `frontend/dist` and automatically serve the built SPA static assets on `/` while serving all API routes on `/api/*`.

---

## 🔍 Verification & Health Checks

- **Backend Health**: Visit `https://<your-backend-name>.onrender.com/api/health`
  - Expected response: `{"status": "healthy", "platform": "TrendWear S&OP + Procurement Intelligence Platform", ...}`
- **Interactive API Docs (Swagger UI)**: Visit `https://<your-backend-name>.onrender.com/docs`
- **Frontend App**: Visit `https://<your-frontend-name>.onrender.com`
  - Ensure filters, charts, optimization solver, and scenario simulator fetch live data without CORS errors.

---

## 💡 Key Deployment Notes

1. **Free Tier Cold Starts**:
   - Free instances on Render spin down after 15 minutes of inactivity.
   - The first request to the backend after inactivity may take 30–50 seconds to boot up. Subsequent requests will be fast.
2. **Environment Variables**:
   - `VITE_API_BASE_URL`: The frontend uses this to know where the FastAPI backend is located.
   - `ALLOWED_ORIGINS`: Set to `*` by default for CORS, or lock it down to your frontend's Render URL.
   - `PORT`: Automatically assigned by Render; FastAPI dynamically binds to `0.0.0.0:$PORT`.

