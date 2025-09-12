import React, { useState } from "react";

const CareerAdvisorFrontend = () => {
  const [userSkills, setUserSkills] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function to generate star ratings
  const getStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
      stars += '⭐';
    }
    if (halfStar) {
      stars += '⭐';
    }
    return stars;
  };

  // Enhanced styles
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "40px 10px",
      fontFamily: "'Poppins', sans-serif",
    },
    card: {
      background: "rgba(255,255,255,0.95)",
      borderRadius: "24px",
      boxShadow: "0 8px 32px rgba(67, 97, 238, 0.15)",
      padding: "36px 32px",
      maxWidth: "480px",
      width: "100%",
      margin: "0 auto 32px auto",
      transition: "box-shadow 0.3s",
    },
    header: {
      textAlign: "center",
      marginBottom: "32px",
      color: "#4361ee",
    },
    logo: {
      fontSize: "2.8rem",
      marginBottom: "10px",
      color: "#4361ee",
    },
    title: {
      fontSize: "2.2rem",
      fontWeight: 700,
      marginBottom: "8px",
      color: "#222",
      letterSpacing: "1px",
    },
    subtitle: {
      fontSize: "1.1rem",
      color: "#4361ee",
      marginBottom: "0",
    },
    formGroup: {
      marginBottom: "24px",
    },
    label: {
      display: "block",
      fontWeight: 600,
      marginBottom: "10px",
      color: "#4361ee",
      fontSize: "1.1rem",
      letterSpacing: "0.5px",
    },
    textarea: {
      width: "100%",
      padding: "18px",
      border: "2px solid #e0e0e0",
      borderRadius: "14px",
      fontFamily: "'Poppins', sans-serif",
      fontSize: "1rem",
      resize: "vertical",
      minHeight: "120px",
      transition: "border-color 0.3s, box-shadow 0.3s",
      boxShadow: "0 2px 8px rgba(67, 97, 238, 0.07)",
      outline: "none",
    },
    hint: {
      marginTop: "8px",
      fontSize: "0.95rem",
      color: "#888",
      background: "#f0f7ff",
      borderRadius: "8px",
      padding: "8px 12px",
      display: "inline-block",
    },
    button: {
      background: "linear-gradient(90deg, #4361ee 0%, #3a0ca3 100%)",
      color: "white",
      border: "none",
      borderRadius: "14px",
      padding: "16px 0",
      fontSize: "1.1rem",
      fontWeight: 600,
      cursor: "pointer",
      width: "100%",
      marginTop: "10px",
      boxShadow: "0 4px 16px rgba(67, 97, 238, 0.12)",
      transition: "transform 0.2s, box-shadow 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
    },
    buttonDisabled: {
      background: "#bdbdbd",
      cursor: "not-allowed",
      boxShadow: "none",
      transform: "none",
    },
    loader: {
      display: "inline-block",
      width: "22px",
      height: "22px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderRadius: "50%",
      borderTopColor: "#fff",
      animation: "spin 1s linear infinite",
      marginRight: "10px",
    },
    resultsContainer: {
      maxWidth: "700px",
      width: "100%",
      margin: "0 auto",
      marginTop: "24px",
      padding: "24px",
      background: "rgba(255,255,255,0.97)",
      borderRadius: "20px",
      boxShadow: "0 4px 24px rgba(67, 97, 238, 0.10)",
    },
    resultsTitle: {
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#4361ee",
      marginBottom: "18px",
      textAlign: "center",
    },
    resultsSection: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "18px",
    },
    jobCard: {
      background: "#f0f7ff",
      borderRadius: "14px",
      boxShadow: "0 2px 8px rgba(67, 97, 238, 0.07)",
      padding: "18px",
      borderLeft: "5px solid #4361ee",
      transition: "box-shadow 0.2s",
    },
    jobTitle: {
      fontSize: "1.2rem",
      fontWeight: 600,
      color: "#222",
      marginBottom: "8px",
    },
    jobRank: {
      display: "inline-block",
      background: "#e0e7ff",
      color: "#3a0ca3",
      padding: "4px 14px",
      borderRadius: "20px",
      fontSize: "0.95rem",
      fontWeight: 500,
      marginBottom: "12px",
    },
    whyFit: {
      marginTop: "12px",
    },
    whyFitTitle: {
      fontWeight: 600,
      marginBottom: "6px",
      color: "#4361ee",
    },
    reason: {
      marginBottom: "6px",
      paddingLeft: "15px",
      position: "relative",
      color: "#333",
    },
    noResults: {
      textAlign: "center",
      padding: "40px",
      color: "#666",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(67, 97, 238, 0.07)",
      marginTop: "24px",
    },
    noResultsIcon: {
      fontSize: "3rem",
      color: "#bdbdbd",
      marginBottom: "15px",
    },
    footer: {
      textAlign: "center",
      marginTop: "40px",
      color: "#4361ee",
      fontSize: "1rem",
      fontWeight: 500,
      letterSpacing: "0.5px",
    }
  };

  // Add keyframes for loader animation
  const keyframesStyle = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRecommendations([]);

    try {
      const response = await fetch("http://localhost:8080/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: [userSkills]
        }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{keyframesStyle}</style>
      <div style={styles.header}>
        <div style={styles.logo}>
          <i className="fas fa-road"></i>
        </div>
        <div style={styles.title}>CareerPath Advisor</div>
        <div style={styles.subtitle}>
          Discover your ideal career based on your skills, experience, and interests
        </div>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <i className="fas fa-user-graduate"></i> Tell us about yourself
            </label>
            <textarea
              style={styles.textarea}
              rows={6}
              value={userSkills}
              onChange={(e) => setUserSkills(e.target.value)}
              placeholder="Example: I have experience with Python programming, data analysis, and machine learning. I enjoy solving complex problems and working with large datasets. I'm also skilled in SQL and data visualization."
              required
              onFocus={(e) => {
                e.target.style.borderColor = "#4361ee";
                e.target.style.boxShadow = "0 0 0 3px rgba(67, 97, 238, 0.18)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e0e0e0";
                e.target.style.boxShadow = "none";
              }}
            />
            <p style={styles.hint}>
              <i className="fas fa-lightbulb" style={{color: "#4361ee", marginRight: "5px"}}></i>
              Be specific about your technical skills, soft skills, industries you've worked in, and what you enjoy doing.
            </p>
          </div>
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = "scale(1.04)";
                e.target.style.boxShadow = "0 8px 24px rgba(67, 97, 238, 0.18)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 4px 16px rgba(67, 97, 238, 0.12)";
              }
            }}
          >
            {loading ? (
              <>
                <div style={styles.loader}></div>
                Analyzing your skills...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i>
                Find My Career Matches
              </>
            )}
          </button>
        </form>
      </div>

      {recommendations.length > 0 && (
        <div style={styles.resultsContainer}>
          <div style={styles.resultsTitle}>
            <i className="fas fa-briefcase"></i> Recommended Careers For You
          </div>
          <div style={styles.resultsSection}>
            {recommendations.map((job, idx) => (
              <div key={idx} style={styles.jobCard}>
                <div style={styles.jobTitle}>{job.title}</div>
                <div style={styles.jobRank}>
                  Match strength: {getStarRating(job.rank)}
                </div>
                <div style={styles.whyFit}>
                  <div style={styles.whyFitTitle}>Why this might be a good fit:</div>
                  <ul style={{listStyle: "none", padding: 0}}>
                    {job.why_fit.map((reason, i) => (
                      <li key={i} style={styles.reason}>
                        <span style={{position: "absolute", left: 0, color: "#4361ee", fontWeight: "bold"}}>•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && !loading && (
        <div style={styles.noResults}>
          <i className="fas fa-search" style={styles.noResultsIcon}></i>
          <h2>No matches yet</h2>
          <p>Enter your skills and experience to get career recommendations</p>
        </div>
      )}

      <footer style={styles.footer}>
        CareerPath Advisor &copy; 2023 | Find your perfect career match
      </footer>
    </div>
  );
};

export default CareerAdvisorFrontend;