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
GEN_MODEL = os.getenv("GEN_MODEL", "gemini-1.5-flash")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-004")
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
            for emb in resp["embeddings"]:
                embeddings.append(np.array(emb, dtype=np.float32))
        else:
            raise ValueError("No embeddings found in response")
    else:
        emb = getattr(resp, "embedding", None)
        if emb is None:
            raise ValueError("No embedding found in response object")
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
    # Collect all user input as a single string for embedding
    profile_text = (
        f"Skills: {', '.join(req.get('skills',[]))}\n"
    )

    # Step 1: Embed user profile
    try:
        q_emb = get_embeddings(profile_text)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Step 2: Retrieve similar careers
    idxs, sims = top_k_similar(q_emb, k=TOP_K)
    retrieved = []
    for rank, (i, s) in enumerate(zip(idxs, sims), 1):
        c = career_meta[i]
        retrieved.append({
            "title": c.get("title", ""),
            "summary": c.get("summary", ""),
            "skills": c.get("skills", []),
            "rank": rank,
            "why_fit": [
                f"Similarity score: {s:.2f}",
                f"Required skills: {', '.join(c.get('skills', []))}"
            ]
        })

    # Step 3: Return recommendations
    return jsonify({"recommendations": retrieved})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)