import faiss
import numpy as np
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_jd_embedding(company_id, job_id):
    path = os.path.join(
        BASE_DIR, "vectors", str(company_id), "jd", f"{job_id}.npy"
    )
    return np.load(path)

def load_cv_index(company_id, candidate_id):
    index_path = os.path.join(
        BASE_DIR, "vectors", str(company_id), "cv", f"{candidate_id}.index"
    )
    meta_path = os.path.join(
        BASE_DIR, "vectors", str(company_id), "cv", f"{candidate_id}_meta.json"
    )

    index = faiss.read_index(index_path)
    metadata = json.load(open(meta_path))
    return index, metadata