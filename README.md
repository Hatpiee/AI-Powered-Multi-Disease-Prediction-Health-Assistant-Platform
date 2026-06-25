# AI-Powered Multi-Disease Prediction & Health Assistant Platform

A full-stack clinical decision support system that predicts risk for four diseases using machine learning, explains predictions with SHAP, and delivers AI-generated recommendations through a RAG-powered health assistant.

---

## Features

- **Multi-Disease Prediction** — Risk assessment for Diabetes, Heart Disease, Liver Disease, and Chronic Kidney Disease using trained scikit-learn models
- **Explainable AI** — SHAP-based feature importance charts so users understand what drove each prediction
- **AI Clinical Recommendations** — Groq LLM generates personalized, actionable health advice for every prediction
- **RAG Health Chat** — Retrieval-Augmented Generation chatbot backed by a medical knowledge base (ChromaDB + HuggingFace embeddings)
- **Medical Report Extraction** — Upload a PDF report and the system auto-fills assessment forms from extracted values
- **Prediction History** — Full log of past assessments with risk levels and recommendations
- **Appointment Booking** — Schedule follow-up consultations directly from the platform
- **PDF Report Download** — Export any prediction result as a formatted PDF report
- **JWT Authentication** — Secure register/login with token-based sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Python, SQLAlchemy, Alembic |
| ML Models | scikit-learn (Random Forest / SVM), joblib |
| Explainability | SHAP |
| AI Recommendations | Groq API (llama-3) |
| RAG Chat | LangChain, ChromaDB, HuggingFace Embeddings |
| Auth | JWT (python-jose) |
| Database | SQLite (dev) |

---

## Project Structure

```
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/v1/           # Route handlers
│   │   ├── ml/               # Predictors per disease
│   │   ├── rag/              # Vector store & embeddings
│   │   ├── services/         # SHAP, recommendations, reports
│   │   └── models/           # SQLAlchemy ORM models
│   └── alembic/              # DB migrations
├── frontend/                 # Next.js application
│   ├── app/
│   │   ├── (auth)/           # Login & register pages
│   │   └── (dashboard)/      # Dashboard, assessment, results, history
│   ├── components/           # Reusable UI components
│   └── lib/                  # API client, auth helpers
├── ml/
│   ├── models/               # Trained .pkl model files
│   └── datasets/             # Training datasets
├── knowledge_base/           # Markdown medical docs for RAG
├── dev.js                    # Single-command dev launcher
└── Start Dev.bat             # Windows one-click startup
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repo

```bash
git clone https://github.com/Hatpiee/AI-Powered-Multi-Disease-Prediction-Health-Assistant-Platform.git
cd AI-Powered-Multi-Disease-Prediction-Health-Assistant-Platform
```

### 2. Set up the Python virtual environment

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

pip install -r backend/requirements.txt
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:

```
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=your_jwt_secret
```

### 4. Run database migrations

```bash
cd backend
alembic upgrade head
cd ..
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 6. Start the platform

**Option A — One command (recommended):**

```bash
npm run dev          # from project root
```

Or double-click **`Start Dev.bat`** on Windows.

**Option B — Separate terminals:**

```bash
# Terminal 1 — backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
node node_modules/next/dist/bin/next dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

1. **Register / Log in** to your account
2. Go to **New Assessment** and select a disease type
3. Enter patient vitals manually or **upload a PDF report** to auto-fill
4. Submit — the model returns a risk score, risk level, and SHAP chart instantly
5. **AI recommendations** appear within seconds (generated in the background by Groq)
6. Download a **PDF report** or book a **follow-up appointment**
7. Use the **Health Chat** for RAG-powered Q&A on any health topic

---

## API Reference

Interactive API docs available at [http://localhost:8000/docs](http://localhost:8000/docs) when the backend is running.

---

## License

MIT License
