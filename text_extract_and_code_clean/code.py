import requests
from pdfminer.high_level import extract_text
import re
from groq import Groq
import json


client = Groq(api_key="your_groq_api_key_here")


# ---------------------------------------------------
# DOWNLOAD CV PDF FROM CLOUDINARY LINK
# ---------------------------------------------------
def download_cv_pdf(url, filename="cv.pdf"):
    print("Downloading CV PDF...")

    r = requests.get(url, timeout=20)
    r.raise_for_status()

    # Validate PDF
    if not r.content.startswith(b"%PDF"):
        raise ValueError("Provided link does NOT point to a valid PDF")

    with open(filename, "wb") as f:
        f.write(r.content)

    return filename






# ---------------------------------------------------
# EXTRACT RAW TEXT FROM PDF
# ---------------------------------------------------
def extract_pdf(path):
    text = extract_text(path)
    text = text.replace("\r", "\n")
    text = re.sub(r"\n+", "\n", text)
    return text.strip()



# ---------------------------------------------------
# STEP 2: AI Structured JSON Extraction
# ---------------------------------------------------
def extract_and_clean(cv_text):

    prompt = f"""
You are an AI system that extracts resume data.

Return output ONLY in this JSON format:

{{
  "raw_text": "",
  "name": "",
  "email": "",
  "phone": "",
  "skills": [],
  "experience": [
    {{
      "company": "",
      "role": "",
      "duration": ""
    }}
  ],
  "education": [
    {{
      "degree": "",
      "college": "",
      "year": ""
    }}
  ]
}}

Write ONE SINGLE PARAGRAPH in raw_text including:
- Name
- Education (degree or school or secondary + institute or collage + years)
- Skills or technical Skills(all)
- Experience (roles + dates + descriptions)
- Achievements (with years)


RULES FOR name:
- Extract ONLY the person's full name from the CV.

RULES FOR email:
- Must end with @gmail.com or institute domain.

RULES FOR phone:
- Extract any +91 or 10-digit phone number.

RULES FOR skills:
- Extract ONLY actual technologies, languages, tools.

RULES FOR experience:
- For EACH experience block, extract:
  - company
  - role
  - duration

RULES FOR education:
- For EACH education row:
  - degree or school or seconary education
  - college/school
  - year


DO NOT invent anything.
Use ONLY information from the raw resume.

RAW RESUME TEXT:
{cv_text}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    return response.choices[0].message.content.strip()


# ---------------------------------------------------
# MAIN
# ---------------------------------------------------
if __name__ == "__main__":

    # Manikanta sends THIS link
    cloudinary_cv_url = "PASTE_MANIKANTA_CLOUDINARY_PDF_LINK_HERE"

    try:
        pdf_path = download_cv_pdf(cloudinary_cv_url)
        cv_text = extract_pdf(pdf_path)
        output_json = extract_and_clean(cv_text)
        print(output_json)

    except Exception as e:
        print("ERROR:", e)
