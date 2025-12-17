import numpy as np

def retrieve_chunks(jd_embedding, index):
    """
    Extract all CV vectors from FAISS index safely
    """
    n = index.ntotal

    cv_vectors = np.vstack([index.reconstruct(i) for i in range(n)])

    return cv_vectors


def compute_score(jd_embedding, cv_vectors):
    """
    Compute cosine similarity between JD and CV vectors
    Return average similarity as score
    """
    jd = jd_embedding / np.linalg.norm(jd_embedding)

    sims = []
    for cv in cv_vectors:
        cv = cv / np.linalg.norm(cv)
        sim = np.dot(jd, cv)
        sims.append(sim)

    score = (sum(sims) / len(sims) + 1) / 2
    return round(score*100, 3)