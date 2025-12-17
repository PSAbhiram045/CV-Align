import faiss
import numpy as np
import json
import os

# 🔑 Absolute shared vector store
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE_ROOT = os.path.join(BASE_DIR, "vector_store")

INDICES_DIR = os.path.join(STORE_ROOT, "indices")
META_DIR = os.path.join(STORE_ROOT, "metadata")


def load_jd_embedding(company_id: str, job_id: str) -> np.ndarray:
    index_path = os.path.join(
        INDICES_DIR,
        f"company_{company_id}_job_{job_id}_jd.index"
    )

    if not os.path.exists(index_path):
        raise FileNotFoundError(f"JD index not found: {index_path}")

    index = faiss.read_index(index_path)

    # JD has exactly ONE vector
    return index.reconstruct(0)


def load_cv_index(company_id: str, job_id: str):
    index_path = os.path.join(
        INDICES_DIR,
        f"company_{company_id}_job_{job_id}_cv.index"
    )

    meta_path = os.path.join(
        META_DIR,
        f"company_{company_id}_job_{job_id}_cv.json"
    )

    if not os.path.exists(index_path):
        raise FileNotFoundError(f"CV index not found: {index_path}")

    index = faiss.read_index(index_path)

    metadata = []
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            metadata = json.load(f)

    return index, metadata
