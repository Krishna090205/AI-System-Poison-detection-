# AI System: Poison Detection in Machine Learning Datasets

A hybrid multi-model framework for detecting, classifying, and mitigating data poisoning attacks in machine learning datasets.

## Overview

Data poisoning is an adversarial threat where malicious samples are injected into training datasets to degrade model accuracy, introduce backdoors, or manipulate decision boundaries. This project provides an end-to-end defense system consisting of:

- **Hybrid 7-Model AI Engine**: Combines Autoencoders, Isolation Forests, Local Outlier Factor (LOF), One-Class SVM, DBSCAN, Statistical Analysis (Z-score/IQR), and Attack Pattern Classification.
- **FastAPI Backend**: Asynchronous REST API for high-performance dataset ingestion, poisoning detection, metrics analysis, and automated dataset sanitization/cleaning.
- **React + Vite Frontend**: Modern interactive dashboard with real-time analysis visualization, light/dark theme support, history tracking, and interactive dataset cleaning tools.
- **Docker Support**: Containerized configuration for easy deployment.

---

## Architecture

```
AI System
├── backend_api/              # FastAPI application & ML pipeline
│   ├── api/                  # API routes and Pydantic schemas
│   ├── database/             # MongoDB Atlas integration
│   ├── ml_models/            # 7-model hybrid poison detection suite
│   │   ├── dataset_processing/
│   │   ├── autoencoder.py
│   │   ├── attack_classifier.py
│   │   └── poison_detector.py
│   ├── utils/                # File handlers and helper utilities
│   ├── Dockerfile            # Backend container configuration
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # Application entry point
├── frontend_react/           # Vite + React User Interface
│   ├── src/
│   │   ├── components/       # UI Components (Sidebar, ThemeToggle, etc.)
│   │   ├── context/          # State management (Theme context)
│   │   ├── pages/            # Dashboard, Upload, History, FixDataset, Home
│   │   └── styles/           # Design system tokens and styling
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite build configuration
├── test_datasets/            # Synthetic data generation and sample tests
│   └── generate_test_data.py # Script for generating benign & poisoned datasets
└── docker-compose.yml        # Multi-container orchestration
```

---

## Getting Started

### Prerequisites

- **Python**: 3.9+
- **Node.js**: 18+ & npm
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection string

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend_api
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux / macOS
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your MongoDB connection details:
   ```bash
   cp .env.example .env
   ```

5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   API Docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend_react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   Access the dashboard at: [http://localhost:5173](http://localhost:5173)

---

### Running with Docker

To spin up the entire stack with Docker Compose:
```bash
docker-compose up --build
```

---

## Features

- **Multi-Model Consensus Scoring**: Weighted ensemble detection across unsupervised anomaly detection and deep autoencoder reconstruction error.
- **Attack Classification**: Identifies targeted backdoor injections, label flipping, and clean-label poisoning attacks.
- **Automated Dataset Sanitization**: Download cleaned, sanitized versions of flagged datasets with poisoned rows removed or repaired.
- **Comprehensive Analytics**: Visual inspection of outlier scores, feature distributions, and attack severity indicators.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
