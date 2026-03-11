cat > ~/brain-tumor-identification/README.md << 'EOF'
# 🧠 Brain Tumor Classification

A deep learning classifier that identifies brain tumors from MRI scans into 4 categories using transfer learning with EfficientNetV2-L.

**Classes:** Glioma · Meningioma · No Tumor · Pituitary

---

## Results

| Metric | Value |
|---|---|
| Validation Accuracy | 97% |
| Macro ROC-AUC | 0.9977 |
| Glioma F1 | 0.96 |
| Meningioma F1 | 0.94 |
| No Tumor F1 | 0.99 |
| Pituitary F1 | 0.98 |

---

## Project Structure

\`\`\`
├── brain-tumor-app/
│   ├── backend/        ← FastAPI + Grad-CAM inference server
│   └── frontend/       ← Next.js web app (v0 generated)
├── src/                ← Training pipeline
│   ├── config.py
│   ├── dataset.py
│   ├── model.py
│   ├── train.py
│   ├── evaluate.py
│   └── gradcam.py
├── predict.py          ← Single image CLI inference
└── requirements.txt
\`\`\`

---

## Setup

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Run

\`\`\`bash
# Backend
cd brain-tumor-app/backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd brain-tumor-app/frontend
npm install && npm run dev
\`\`\`

Open http://localhost:3000

---

## Model Architecture

- **Backbone:** EfficientNetV2-L (pretrained ImageNet)
- **Input:** 224×224
- **Head:** GlobalAveragePooling → BatchNorm → Dense(512) → Dropout(0.5) → Softmax(4)
- **Training:** Two-phase (head-only → fine-tune top 30% backbone)
- **Optimiser:** AdamW lr=1e-3/1e-5, weight decay=1e-4
- **Class imbalance:** Balanced class weights

## Hardware

RTX 4060 Laptop GPU (8GB) via WSL2 on Windows 11.

## Author

Akella Ahlad Achintya — GITAM University Bengaluru (2023006111)  
Mentor: Dr. Showkat Ahmad Dar
EOF