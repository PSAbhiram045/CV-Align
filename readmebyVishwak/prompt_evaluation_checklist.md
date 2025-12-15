✅ 1. JSON Validity Tests

Output MUST be valid JSON
No extra text before/after JSON
No nested objects inside strengths/weaknesses
No missing or extra fields

✅ 2. Strengths Prompt Evaluation

Check if:
Strengths are only from CV
Strengths match items in JD
No hallucinated strengths
No irrelevant strengths
Strengths are short factual strings
Lists all relevant strengths (no under-generation)

✅ 3. Weaknesses Prompt Evaluation

Check if:
Weaknesses are JD gaps
Weaknesses DO NOT include irrelevant/random skills
No hallucinated skills
No repeated weaknesses
Weaknesses match JD requirements & CV missing items

✅ 4. Role-Fit Prompt Evaluation

Check:
Explanation uses 4–6 sentences
Uses JD & CV accurately
Justifies score logically
Mentions strengths/weaknesses indirectly
No hallucinations
Uses neutral recruiter language

