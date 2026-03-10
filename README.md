## Results

| Metric | Value |
|---|---|
| Validation Accuracy | 97% |
| Macro ROC-AUC | 0.9977 |
| Glioma F1 | 0.96 |
| Meningioma F1 | 0.94 |
| Notumor F1 | 0.99 |
| Pituitary F1 | 0.98 |

### Per-Class AUC
| Class | AUC |
|---|---|
| Glioma | 0.9960 |
| Meningioma | 0.9962 |
| No Tumor | 0.9997 |
| Pituitary | 0.9991 |

### Training Setup
- **Hardware:** NVIDIA RTX 4060 Laptop GPU (8GB VRAM)
- **OS:** Windows 11 via WSL2 (Ubuntu 24.04)
- **Framework:** TensorFlow 2.20.0, Python 3.11
- **Phase 1:** 10 epochs, frozen backbone, LR=1e-3 → val_accuracy: 92%
- **Phase 2:** 15 epochs, top 30% backbone unfrozen, LR=1e-5 → val_accuracy: 97%