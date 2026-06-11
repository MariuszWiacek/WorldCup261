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
const database = getDatabase(app);

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    onValue(ref(database, 'results'), snap => setResults(snap.val() || {}));
    onValue(ref(database, 'submittedData'), snap => setSubmittedData(snap.val() || {}));
  }, []);

  useEffect(() => {
    if (!submittedData || !results) return;

    const buildProfiles = [];

    Object.keys(submittedData).forEach(user => {
      const bets = submittedData[user] || {};

      let outcomeCorrect = 0;
      let outcomeTotal = 0;

      let scoreCorrect = 0;
      let scoreTotal = 0;

      const teamStats = {};
      let emptyBets = 0;

      Object.entries(bets).forEach(([matchId, bet]) => {
        const result = results[matchId];

        if (!bet || !bet.score) {
          emptyBets++;
          return;
        }

        if (!result) return;

        const [rh, ra] = result.split(':').map(Number);
        const actualOutcome = rh === ra ? 'X' : rh > ra ? '1' : '2';

        const [bh, ba] = bet.score.split(':').map(Number);

        // OUTCOME
        outcomeTotal++;
        if (bet.bet === actualOutcome) outcomeCorrect++;

        // SCORE
        scoreTotal++;
        if (bh === rh && ba === ra) scoreCorrect++;

        // TEAM tracking
        const team = bet.bet === '1' ? bet.home : bet.away;

        if (!teamStats[team]) {
          teamStats[team] = { ok: 0, bad: 0 };
        }

        if (bet.bet === actualOutcome) {
          teamStats[team].ok++;
        } else {
          teamStats[team].bad++;
        }
      });

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      // STYLE CLASSIFICATION
      let style = "Zrównoważony analityk";

      if (outcomeRate > 0.65 && scoreRate < 0.2) {
        style = "Taktyczny typer";
      } else if (scoreRate > 0.25) {
        style = "Łowca wyników";
      } else if (outcomeRate < 0.4) {
        style = "Chaotyczny typer";
      }

      // BEST / WORST TEAMS
      const bestTeams = Object.entries(teamStats)
        .sort((a, b) => b[1].ok - a[1].ok)
        .slice(0, 3)
        .map(t => t[0]);

      const worstTeams = Object.entries(teamStats)
        .sort((a, b) => b[1].bad - a[1].bad)
        .slice(0, 3)
        .map(t => t[0]);

      buildProfiles.push({
        user,
        style,
        outcomeRate,
        scoreRate,
        emptyBets,
        bestTeams,
        worstTeams
      });
    });

    setProfiles(buildProfiles);
  }, [submittedData, results]);

  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '12px', color: '#fff' }}>

      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', color: '#FFD700' }}>
            <h2>🏆 Profily graczy Mistrzostw Świata</h2>
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

              <h3 style={{ color: '#FFD700' }}>{p.user}</h3>

              <p><strong>🏟️ Styl:</strong> {p.style}</p>

              <p style={{ color: '#ccc' }}>
                🧠 Trafność 1X2: {pct(p.outcomeRate)} <br />
                🎯 Trafność dokładnego wyniku: {pct(p.scoreRate)}
              </p>

              <p style={{ color: '#ccc' }}>
                ⚽ Najlepsze drużyny: {p.bestTeams.join(', ') || '------'}
              </p>

              <p style={{ color: '#ccc' }}>
                💔 Najgorsze drużyny: {p.worstTeams.join(', ') || '------'}
              </p>

              <p style={{ color: '#999', fontSize: '0.85rem' }}>
                🧾 Puste typy: {p.emptyBets}
              </p>

              <div style={{ marginTop: '10px', color: '#FFD700' }}>
                🧠 Werdykt:{" "}
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