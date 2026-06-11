import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';

// Firebase config
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
const db = getDatabase(app);

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    onValue(ref(db, 'results'), snap => setResults(snap.val() || {}));
    onValue(ref(db, 'submittedData'), snap => setSubmittedData(snap.val() || {}));
  }, []);

  useEffect(() => {
    if (!submittedData || !results) return;

    const output = [];

    Object.keys(submittedData).forEach(user => {
      const bets = submittedData[user] || {};

      let outcomeCorrect = 0;
      let outcomeTotal = 0;

      let scoreCorrect = 0;
      let scoreTotal = 0;

      let emptyBets = 0;

      // 🧠 TEAM SYSTEM (FIXED)
      const teamStats = {};

      Object.entries(bets).forEach(([matchId, bet]) => {
        const result = results[matchId];
        if (!bet || !result) return;

        if (!bet.score || bet.score === ':::') {
          emptyBets++;
          return;
        }

        const [rh, ra] = result.split(':').map(Number);
        const actualOutcome = rh === ra ? 'X' : rh > ra ? '1' : '2';

        const [bh, ba] = bet.score.split(':').map(Number);

        // --------------------
        // OUTCOME
        // --------------------
        outcomeTotal++;
        if (bet.bet === actualOutcome) outcomeCorrect++;

        // --------------------
        // SCORE
        // --------------------
        scoreTotal++;
        if (bh === rh && ba === ra) scoreCorrect++;

        // --------------------
        // TEAM TRACKING (FIXED LOGIC)
        // --------------------
        const home = bet.home;
        const away = bet.away;

        if (!teamStats[home]) {
          teamStats[home] = { points: 0, cost: 0, total: 0 };
        }

        if (!teamStats[away]) {
          teamStats[away] = { points: 0, cost: 0, total: 0 };
        }

        teamStats[home].total++;
        teamStats[away].total++;

        if (bet.bet === actualOutcome) {
          // correct prediction → "team gave you points"
          teamStats[home].points++;
          teamStats[away].points++;
        } else {
          // wrong prediction → "team cost you points"
          teamStats[home].cost++;
          teamStats[away].cost++;
        }
      });

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      // 🏟️ STYLE CLASSIFICATION
      let style = "Zrównoważony analityk";

      if (outcomeRate > 0.65 && scoreRate < 0.2) {
        style = "Taktyczny typer";
      } else if (scoreRate > 0.25) {
        style = "Łowca wyników";
      } else if (outcomeRate < 0.4) {
        style = "Chaotyczny typer";
      }

      // ⚽ TEAM FILTER (IMPORTANT: avoid fake stats)
      const validTeams = Object.entries(teamStats).filter(
        ([_, v]) => v.total >= 3
      );

      const bestPointTeams = [...validTeams]
        .sort((a, b) => b[1].points - a[1].points)
        .slice(0, 3)
        .map(([team]) => team);

      const worstPointTeams = [...validTeams]
        .sort((a, b) => b[1].cost - a[1].cost)
        .slice(0, 3)
        .map(([team]) => team);

      // 🏆 OVR (FIFA STYLE RATING)
      const OVR = Math.round((outcomeRate * 0.7 + scoreRate * 0.3) * 100);

      output.push({
        user,
        style,
        OVR,
        outcomeRate,
        scoreRate,
        emptyBets,
        bestPointTeams,
        worstPointTeams
      });
    });

    setProfiles(output);
  }, [submittedData, results]);

  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '12px', color: '#fff' }}>

      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', color: '#FFD700' }}>
            <h2>🏆 FIFA Betting Profiles</h2>
            <hr style={{ borderColor: '#FFD700' }} />
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>

          {profiles.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: '#1e1e1e',
                padding: '14px',
                marginBottom: '20px',
                borderRadius: '12px',
                border: '1px solid #2a2a2a'
              }}
            >

              <h2 style={{ color: '#FFD700' }}>🏆 {p.OVR} OVR</h2>
              <h4>{p.style}</h4>

              <p style={{ color: '#ccc' }}>
                🧠 Outcome: {pct(p.outcomeRate)} <br />
                🎯 Score: {pct(p.scoreRate)}
              </p>

              <p style={{ color: '#ccc' }}>
                ⚽ Teams giving points: {p.bestPointTeams.join(', ') || '---'}
              </p>

              <p style={{ color: '#ccc' }}>
                💔 Teams costing points: {p.worstPointTeams.join(', ') || '---'}
              </p>

              <p style={{ color: '#999', fontSize: '0.85rem' }}>
                🧾 Empty bets: {p.emptyBets}
              </p>

              <div style={{ marginTop: '10px', color: '#FFD700' }}>
                🧠 Verdict:{" "}
                {p.style === "Taktyczny typer" && "Dobrze czytasz wyniki meczów, ale trudniej z dokładnymi wynikami."}
                {p.style === "Łowca wyników" && "Wysokie ryzyko — skupiasz się na dokładnych wynikach."}
                {p.style === "Zrównoważony analityk" && "Stabilny i zrównoważony styl typowania."}
                {p.style === "Chaotyczny typer" && "Niestabilne wyniki — duża zmienność typów."}
              </div>

            </div>
          ))}

        </Col>
      </Row>

    </Container>
  );
};

export default Stats;