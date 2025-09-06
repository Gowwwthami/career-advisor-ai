import React, { useState } from "react";

// CareerAdvisorFrontend.jsx
// Single-file React component (default export) built with Tailwind CSS in mind.
// Usage: Drop this component into your React app (e.g., src/App.jsx) and ensure
// the backend is running at /recommend (same origin) or set REACT_APP_API_URL env.

export default function CareerAdvisorFrontend() {
  const API_URL = "http://127.0.0.1:8080/recommend";

  const [name, setName] = useState("");
  const [education, setEducation] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [constraints, setConstraints] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function addInterest() {
    const t = interestInput.trim();
    if (t && !interests.includes(t)) {
      setInterests((s) => [...s, t]);
      setInterestInput("");
    }
  }

  function removeInterest(i) {
    setInterests((s) => s.filter((_, idx) => idx !== i));
  }

  function addSkill() {
    const t = skillInput.trim();
    if (t && !skills.includes(t)) {
      setSkills((s) => [...s, t]);
      setSkillInput("");
    }
  }

  function removeSkill(i) {
    setSkills((s) => s.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();


    setError(null);
    setResult(null);
    console.log("API Response:", js);

    if (!name || !education) {
      setError("Please enter at least your name and education.");
      return;
    }

    const payload = {
      name,
      education,
      interests,
      skills,
      constraints,
    };

    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js.error || JSON.stringify(js));
      setResult(js);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Career Advisor
      </h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            className="mt-1 block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Education
          </label>
          <input
            type="text"
            className="mt-1 block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          />
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Interests
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addInterest}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {interests.map((int, i) => (
              <span
                key={i}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {int}
                <button
                  type="button"
                  onClick={() => removeInterest(i)}
                  className="text-red-600"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Skills
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((sk, i) => (
              <span
                key={i}
                className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {sk}
                <button
                  type="button"
                  onClick={() => removeSkill(i)}
                  className="text-red-600"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Constraints (optional)
          </label>
          <textarea
            className="mt-1 block w-full border rounded-lg px-3 py-2"
            rows={2}
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Get Career Advice"}
        </button>
      </form>

      {/* Results */}
      {error && (
        <div className="mt-6 text-red-600 font-semibold">{error}</div>
      )}
      {result && (
  <pre className="bg-gray-100 p-4 mt-4 rounded">
    {JSON.stringify(result, null, 2)}
  </pre>
)}


    </div>
  );
}
