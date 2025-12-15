
---

# ✅ **4. Create SYSTEM_OVERVIEW.md**

This file explains your entire LLM pipeline.

Put this in:  
**documentation/SYSTEM_OVERVIEW.md**

```md
# System Overview — CVAlign LLM Feedback Module

## Purpose
This module evaluates how well a candidate's CV matches a Job Description (JD) and produces:

- strengths
- weaknesses
- role-fit explanation

It uses LLaMA 3 locally through Ollama.

---

## Architecture Summary

1. **Prompt Loader**
   Loads prompts from /prompts

2. **Template Filling**
   Injects JD and CV into:
   - strengths.txt
   - weaknesses.txt
   - role_fit.txt

3. **LLM Generation**
   Calls LLaMA with retry logic:
   - 3 attempts
   - JSON extraction
   - JSON repair
   - JSON validation

4. **Output Validation**
   Ensures:
   - strengths → list of strings
   - weaknesses → list of strings
   - role_fit → string

5. **Final JSON Output**
   Returned cleanly to FastAPI.

---

## Strengths of This Module
- JSON-safe
- Retry mechanism
- Prompt-engineered
- Error-resilient
- Production-ready structure
- Can integrate with Web UI easily
