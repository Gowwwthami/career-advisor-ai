# backend/app.py
import os
import json
import numpy as np
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

import google.generativeai as genai

# ---------- Load environment ----------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("❌ Set GEMINI_API_KEY in your .env file before running.")

# ---------- Config ----------
GEN_MODEL = os.getenv("GEN_MODEL", "gemini-1.5-flash")     # generation model
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-004")  # embeddings model
TOP_K = int(os.getenv("TOP_K", 3))
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "careers.json")

# ---------- Init Gemini ----------
genai.configure(api_key=GEMINI_API_KEY)
gen_model = genai.GenerativeModel(GEN_MODEL)

# ---------- Load dataset ----------
with open(DATA_PATH, "r", encoding="utf-8") as f:
    careers = json.load(f)

career_texts = [
    f"{c.get('title','')}. {c.get('summary','')} Skills: {', '.join(c.get('skills',[]))}"
    for c in careers
]
career_meta = careers

# ---------- Embeddings helper ----------
def get_embeddings(texts):
    is_single = False
    if isinstance(texts, str):
        texts = [texts]
        is_single = True

    resp = genai.embed_content(
        model=EMBED_MODEL,
        content=texts
    )

    embeddings = []
    if isinstance(resp, dict):
        if "embedding" in resp:
            embeddings.append(np.array(resp["embedding"], dtype=np.float32))
        elif "embeddings" in resp:
            for e in resp["embeddings"]:
                embeddings.append(np.array(e, dtype=np.float32))
        else:
            raise RuntimeError("Unexpected embeddings response: " + str(resp))
    else:
        emb = getattr(resp, "embedding", None)
        if emb is None:
            raise RuntimeError("Unexpected response type: " + str(resp))
        embeddings.append(np.array(emb, dtype=np.float32))

    arr = np.vstack(embeddings)
    return arr[0] if is_single else arr

# ---------- Pre-compute dataset embeddings ----------
print("⚡ Generating embeddings for career dataset...")
career_embeddings = get_embeddings(career_texts)
print("✅ Career embeddings shape:", career_embeddings.shape)

# ---------- Similarity search ----------
def top_k_similar(query_emb, k=3):
    def normalize(x):
        norms = np.linalg.norm(x, axis=1, keepdims=True) + 1e-10
        return x / norms

    A = normalize(career_embeddings)
    qn = query_emb / (np.linalg.norm(query_emb) + 1e-10)
    sims = (A @ qn.reshape(-1, 1)).squeeze()
    idx = np.argsort(-sims)[:k]
    return idx, sims[idx].tolist()

# ---------- Text generation ----------
def generate_with_gemini(prompt, max_output_tokens=700, temperature=0.2):
    resp = gen_model.generate_content(
        prompt,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        },
    )
    return resp.text.strip()

# ---------- Flask app ----------
app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def health():
    return {"status": "ok", "model": GEN_MODEL}

@app.route("/recommend", methods=["POST"])
def recommend():
    req = request.get_json(force=True)
    profile_text = (
        f"Name: {req.get('name','')}\n"
        f"Education: {req.get('education','')}\n"
        f"Interests: {', '.join(req.get('interests',[]))}\n"
        f"Skills: {', '.join(req.get('skills',[]))}\n"
        f"Constraints: {req.get('constraints','')}\n"
    )

    # Step 1: Embed user profile
    try:
        q_emb = get_embeddings(profile_text)
    except Exception as e:
        return jsonify({"ok": False, "error": f"Embedding error: {str(e)}"}), 500

    # Step 2: Retrieve similar careers
    idxs, sims = top_k_similar(q_emb, k=TOP_K)
    retrieved = []
    for i, s in zip(idxs, sims):
        item = career_meta[i].copy()
        item["_score"] = float(s)
        retrieved.append(item)

    retrieved_text = "".join(
        f"- {r['title']}: {r['summary']}\n  Skills: {', '.join(r.get('skills',[]))}\n"
        for r in retrieved
    )

    # Step 3: Build structured prompt
    prompt = f"""You are an empathetic career advisor for students in India.
Given the USER PROFILE and RETRIEVED CAREER CONTEXT, return a JSON object with key 'recommendations' (up to 3 careers). 

Each career must include:
 - title
 - rank (1 = best)
 - why_fit (2 short bullets)
 - required_skills (beginner→intermediate, each with 1 practical task)
 - resources (3 items: title + url)
 - 90_day_plan (weekly milestones for 12 weeks)

USER PROFILE:
{profile_text}

RETRIEVED CAREER CONTEXT:
{retrieved_text}

Return ONLY valid JSON.
"""

    try:
        gen_text = generate_with_gemini(prompt)
    except Exception as e:
        return jsonify({"ok": False, "error": f"Generation error: {str(e)}"}), 500

    # Try parsing JSON
    parsed_json = None
    try:
        parsed_json = json.loads(gen_text)
    except Exception:
        import re
        m = re.search(r"(\{.*\})", gen_text, flags=re.DOTALL)
        if m:
            try:
                parsed_json = json.loads(m.group(1))
            except Exception:
                parsed_json = None

    if not parsed_json:
        return jsonify({"ok": False, "error": "Failed to parse model output", "raw": gen_text}), 500

    return jsonify(parsed_json)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)
