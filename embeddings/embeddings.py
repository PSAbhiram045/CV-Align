# embeddings + vector DB implementation
import os
<<<<<<< HEAD
import json
import time
import uuid
from typing import Tuple, Dict, Any, List

import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
=======
import json  # for output
import time  # for timestamps
import uuid  # for giving ids for embeddings
from typing import Tuple, Dict, Any, List  # for conversions

import numpy as np
from sentence_transformers import SentenceTransformer  # for loading model
import faiss  # vector db
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)

# loading model
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

# storage destinations
<<<<<<< HEAD
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE_ROOT = os.path.join(BASE_DIR, "vector_store")
=======
STORE_ROOT = "vector_store"  # main folder which stores all vector related data
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)

INDICES_DIR = os.path.join(STORE_ROOT, "indices")
META_DIR = os.path.join(STORE_ROOT, "metadata")
os.makedirs(INDICES_DIR, exist_ok=True)
os.makedirs(META_DIR, exist_ok=True)

<<<<<<< HEAD

# PATH HELPERS

def get_paths(company_id: str, job_id: str, data_type: str) -> Tuple[str, str]:
    """
    Build index and metadata paths for a (company, job, type) pair.
    data_type must be "CV" or "JD".
    """
    assert data_type in ("CV", "JD")
    index_name = f"company_{company_id}_job_{job_id}_{data_type.lower()}.index"
    meta_name = f"company_{company_id}_job_{job_id}_{data_type.lower()}.json"
    return (
        os.path.join(INDICES_DIR, index_name),
        os.path.join(META_DIR, meta_name),
    )


# VECTOR NORMALIZATION
=======
# Given a company, job, and type (CV/JD), this determines the exact index file and metadata file paths used to store and retrieve that data.


def get_paths(company_id: int, job_id: int, data_type: str) -> Tuple[str, str]:
    """ Build index and metadata paths for a (company, job, type) pair. 
    data_type must be "CV" or "JD". """
    assert data_type in ("CV", "JD")
    index_name = f"company_{company_id}_job_{job_id}_{data_type.lower()}.index"
    meta_name = f"company_{company_id}_job_{job_id}_{data_type.lower()}.json"
    return (os.path.join(INDICES_DIR, index_name),
            os.path.join(META_DIR, meta_name),
            )

# inorder to use indexing, we need to normalize vectors and convet into float32

>>>>>>> b1a6602 (Add embeddings and vector DB implementation)

def l2_normalize(vec: np.ndarray) -> np.ndarray:
    """L2-normalize a vector (float32)."""
    vec = np.asarray(vec, dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return (vec / norm).astype(np.float32)

<<<<<<< HEAD

# EMBEDDING + CHUNKING
=======
# EMBEDDING + CHUNKING HELPERS

>>>>>>> b1a6602 (Add embeddings and vector DB implementation)

def embed_text(text: str) -> List[float]:
    """Generate embedding and return as Python list."""
    emb = model.encode(text)
    return emb.tolist()


<<<<<<< HEAD
def chunk_text(
    text: str,
    chunk_size: int = 80,
    overlap: int = 20,
) -> List[str]:
    """Word-based chunking with overlap. Designed for CVs."""
=======
def chunk_text(text: str, chunk_size: int = 80, overlap: int = 20, ) -> List[str]:
    """ Word-based chunking with overlap. Designed for CVs. """
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i: i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
    return chunks


<<<<<<< HEAD
def make_metadata(
    company_id: str,
    job_id: str,
    data_type: str,
    text_snippet: str,
    chunk_id: int | None = None,
) -> Dict[str, Any]:
    """Metadata for one embedding."""
    return {
        "company_id": company_id,
        "job_id": job_id,
=======
def make_metadata(company_id: int, job_id: int, data_type: str, text_snippet: str, chunk_id: int = None, ) -> Dict[str, Any]:
    """Metadata for one embedding."""
    return {
        "company_id": int(company_id),
        "job_id": int(job_id),
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
        "type": data_type,  # "CV" or "JD"
        "chunk_id": chunk_id,  # None for JD
        "created_at": int(time.time()),
        "embed_id": str(uuid.uuid4()),
        "snippet": text_snippet[:240],
    }
<<<<<<< HEAD


# FAISS STORAGE

def _create_faiss_index(dim: int):
    """
    Flat inner-product index.
    Vectors are L2-normalized before add,
    so IP ≈ cosine similarity.
    """
=======
# FAISS STORAGE


def _create_faiss_index(dim: int):
    """ Flat inner-product index.
       Vectors are L2-normalized before add,
         so IP ≈ cosine similarity. """
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
    return faiss.IndexFlatIP(dim)


def store_embedding(
    embedding: List[float],
    metadata: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Store one embedding into FAISS and append metadata.
    """
    company_id = metadata["company_id"]
    job_id = metadata["job_id"]
    data_type = metadata["type"]

    index_path, meta_path = get_paths(company_id, job_id, data_type)
    dim = len(embedding)

    # Load or create index
    if os.path.exists(index_path):
        index = faiss.read_index(index_path)
        if index.d != dim:
            raise RuntimeError(
                f"Index dim {index.d} != embedding dim {dim}"
            )
    else:
        index = _create_faiss_index(dim)

    # Normalize and add vector
    vec = l2_normalize(np.array(embedding, dtype=np.float32))
    vec = np.expand_dims(vec, axis=0)
    index.add(vec)

    faiss.write_index(index, index_path)

    # Append metadata
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            meta_list = json.load(f)
    else:
        meta_list = []
<<<<<<< HEAD

    meta_list.append(metadata)

    with open(meta_path, "w") as f:
        json.dump(meta_list, f, indent=2)

    return {
        "status": "success",
        "index_path": index_path,
        "meta_path": meta_path,
        "total_vectors": int(index.ntotal),
    }


# PIPELINES
=======
    meta_list.append(metadata)

    with open(meta_path, "w") as f:
        json.dump(meta_list, f)
    return {"status": "success", "index_path": index_path, "meta_path": meta_path, "total_vectors": int(index.ntotal), }

>>>>>>> b1a6602 (Add embeddings and vector DB implementation)

def process_cv_application(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Called when a candidate applies.

    Payload:
    {
<<<<<<< HEAD
      "company_id": str,
      "job_id": str,
=======
      "company_id": int,
      "job_id": int,
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
      "text": "<CV raw text>"
    }

    - CV is chunked
    - Multiple embeddings per CV
    - All chunks appended to job-level index
    """
    text = payload["text"]
    company_id = payload["company_id"]
    job_id = payload["job_id"]

    chunks = chunk_text(text)

    last_result = None
    for i, chunk in enumerate(chunks):
        emb = embed_text(chunk)
        metadata = make_metadata(
            company_id=company_id,
            job_id=job_id,
            data_type="CV",
            text_snippet=chunk,
            chunk_id=i,
        )
        last_result = store_embedding(emb, metadata)

    return {
        "status": "stored",
        "chunks_added": len(chunks),
        "index_path": last_result["index_path"],
        "meta_path": last_result["meta_path"],
        "total_vectors": last_result["total_vectors"],
    }


def process_jd_creation(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Called when JD is created or updated.

    Payload:
    {
<<<<<<< HEAD
      "company_id": str,
      "job_id": str,
=======
      "company_id": int,
      "job_id": int,
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
      "text": "<JD raw text>"
    }

    - JD is NOT chunked
    - Old JD is OVERWRITTEN
    - Exactly one JD vector per job
    """
    text = payload["text"]
    company_id = payload["company_id"]
    job_id = payload["job_id"]

<<<<<<< HEAD
    # Reset old JD
=======
    #  Reset old JD
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
    index_path, meta_path = get_paths(company_id, job_id, "JD")
    if os.path.exists(index_path):
        os.remove(index_path)
    if os.path.exists(meta_path):
        os.remove(meta_path)

    emb = embed_text(text)
    metadata = make_metadata(
        company_id=company_id,
        job_id=job_id,
        data_type="JD",
        text_snippet=text,
    )

    return store_embedding(emb, metadata)


<<<<<<< HEAD
# SAMPLE TEST
if __name__ == "__main__":
    jd_payload = {
        "company_id": "6",
        "job_id": "22",
=======
# sample test
if __name__ == "__main__":
    jd_payload = {
        "company_id": 6,
        "job_id": 22,
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
        "text": "Hiring backend engineer with Python, Flask, Postgres experience.",
    }
    print("Storing JD:", process_jd_creation(jd_payload))

    cv_payload = {
<<<<<<< HEAD
        "company_id": "6",
        "job_id": "22",
        "text": (
            "Strong Python backend engineer with Flask and Postgres experience. "
            "Worked on scalable APIs, databases, and system design."
        ),
=======
        "company_id": 6,
        "job_id": 22,
        "text": "Strong Python backend engineer with Flask and Postgres experience. "
                "Worked on scalable APIs, databases, and system design.",
>>>>>>> b1a6602 (Add embeddings and vector DB implementation)
    }
    print("Storing CV:", process_cv_application(cv_payload))
