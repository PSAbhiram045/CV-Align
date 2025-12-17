import re

def normalize_text_one_line(text: str) -> str:
    """
    Convert multiline / noisy text into a clean single-line string
    for embedding models.
    """
    text = re.sub(r"\s+", " ", text)   
    return text.strip()
