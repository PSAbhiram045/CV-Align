import numpy as np

def retrieve_chunks(jd_embedding, index):
    """
    Extract all CV vectors from FAISS index safely
    """
    n = index.ntotal

    cv_vectors = np.vstack([index.reconstruct(i) for i in range(n)])

    return cv_vectors


def compute_score(jd_embedding,cv_vectors,k=10):
    jd=jd_embedding/np.linalg.norm(jd_embedding)

    sims=[]

    for cv in cv_vectors:
        cv=cv/np.linalg.norm(cv)
        sims.append(np.dot(jd,cv))

    sims.sort(reverse=True)
    top = sims[:min(k, len(sims))]

    mean_sim = np.mean(top)
    std_sim = np.std(top)

    stretched = (mean_sim - 0.2) / 0.3
    stretched = max(0, min(1, stretched))

    score = stretched * 100
    return round(score, 2)