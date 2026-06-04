import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faTimes, faUser, faTrophy } from '@fortawesome/free-solid-svg-icons';

const firebaseConfig = {
  apiKey: "AIzaSyBnSIOvM6OkqRqujx_kDWzo8RhFBPS7aVw",
  authDomain: "wc2026-396b7.firebaseapp.com",
  databaseURL: "https://wc2026-396b7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wc2026-396b7",
  storageBucket: "wc2026-396b7.firebasestorage.app",
  messagingSenderId: "723842578362",
  appId: "1:723842578362:web:3e5e7f8fce7c2015168f83",
  measurementId: "G-KLLLNCET00"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const SignupPage = ({ onClose }) => {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const playersRef = ref(database, "players");
    onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const playerList = Object.values(data);
        setPlayers(playerList);
      }
    });
  }, []);

  const handleSignup = () => {
    if (name.trim() === "") return;
    const playersRef = ref(database, "players");
    push(playersRef, name.trim());
    setName("");
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        {/* Close Button */}
        <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Header */}
        <div style={headerContainerStyle}>
          <FontAwesomeIcon icon={faTrophy} style={trophyIconStyle} />
          <h2 style={headingStyle}>
            Zapisy! Typer WORLD CUP 2026
          </h2>
          <p style={subHeadingStyle}>Udowodnij, że znasz się na piłce!</p>
        </div>

        <hr style={dividerStyle} />

        {/* Info Box */}
        <div style={infoBoxStyle}>
          <p style={descriptionStyle}>
            <FontAwesomeIcon icon={faCoins} style={{ color: "#ffca28", marginRight: "6px" }} />
            Zrzutka po ok. <strong>60</strong> monet, w zależności od ilości graczy.
          </p>
          <span style={deadlineBadgeStyle}>Zapisy do 10.06</span>
        </div>

        {/* Form */}
        <div style={formStyle}>
          <input
            type="text"
            placeholder="Twoje imię / nick"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleSignup} style={buttonStyle}>
            Zapisz się
          </button>
        </div>

        <hr style={dividerStyle} />

        {/* Stats */}
        <div style={statsContainerStyle}>
          <h3 style={sectionTitleStyle}>
            Ilość zapisanych osób: <span style={counterStyle}>{players.length}</span>
          </h3>
        </div>

        {/* Player List */}
        {players.length > 0 && (
          <div style={listContainerStyle}>
            <ul style={horizontalListStyle}>
              {players.map((player, index) => (
                <li key={index} style={playerStyle}>
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: "12px", marginRight: "6px", opacity: 0.7 }} />
                  {player}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Modern Styles ---
const containerStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(15, 23, 42, 0.85)", // Modern dark overlay with blur logic
  backdropFilter: "blur(8px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
  padding: "20px",
  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const boxStyle = {
  background: "#ffffff",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  borderRadius: "16px",
  padding: "32px",
  maxWidth: "500px",
  width: "100%",
  textAlign: "center",
  position: "relative",
  border: "1px solid #e2e8f0",
};

const closeButtonStyle = {
  position: "absolute",
  top: "16px",
  right: "16px",
  backgroundColor: "#f1f5f9",
  color: "#64748b",
  border: "none",
  borderRadius: "50%",
  width: "32px",
  height: "32px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
  outline: "none",
};

const headerContainerStyle = {
  marginBottom: "16px",
};

const trophyIconStyle = {
  fontSize: "32px",
  color: "#10b981", // Emerald green theme
  marginBottom: "12px",
};

const headingStyle = {
  color: "#0f172a",
  fontWeight: "800",
  margin: "0 0 4px 0",
  fontSize: "22px",
  letterSpacing: "-0.5px",
};

const subHeadingStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "500",
};

const dividerStyle = {
  margin: "20px 0",
  border: "none",
  borderTop: "1px solid #e2e8f0",
};

const infoBoxStyle = {
  background: "#f8fafc",
  padding: "16px",
  borderRadius: "12px",
  marginBottom: "20px",
  border: "1px solid #f1f5f9",
};

const descriptionStyle = {
  fontSize: "15px",
  color: "#334155",
  margin: "0 0 10px 0",
  lineHeight: "1.5",
};

const deadlineBadgeStyle = {
  display: "inline-block",
  backgroundColor: "#fee2e2",
  color: "#ef4444",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "600",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const inputStyle = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "15px",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "12px 24px",
  backgroundColor: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background-color 0.2s",
  width: "100%",
};

const statsContainerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const sectionTitleStyle = {
  fontSize: "15px",
  color: "#475569",
  margin: 0,
  fontWeight: "600",
};

const counterStyle = {
  color: "#10b981",
  fontWeight: "700",
  backgroundColor: "#d1fae5",
  padding: "2px 8px",
  borderRadius: "6px",
  marginLeft: "6px",
};

const listContainerStyle = {
  marginTop: "14px",
  maxHeight: "60px",
  position: "relative",
};

const horizontalListStyle = {
  listStyle: "none",
  padding: "4px 0",
  margin: 0,
  display: "flex",
  flexDirection: "row",
  overflowX: "auto",
  whiteSpace: "nowrap",
  gap: "8px",
  scrollbarWidth: "none", /* Hides default scrollbar standard */
};

const playerStyle = {
  backgroundColor: "#f1f5f9",
  padding: "6px 14px",
  borderRadius: "9999px",
  fontWeight: "600",
  color: "#334155",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  border: "1px solid #e2e8f0",
};

export default SignupPage;