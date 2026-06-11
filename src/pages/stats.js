import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';

const firebaseConfig = {
  apiKey: "AIzaSyBnSIOvM6OkqRqujx_kDWzo8RhFBPS7aVw",
  authDomain: "wc2026-396b7.firebaseapp.com",
  databaseURL: "https://wc2026-396b7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wc2026-396b7",
  storageBucket: "wc2026-396b7.firebasestorage.app",
  messagingSenderId: "723842578362",
  appId: "1:723842578362:web:3e5e7f8fce7c2015168f83",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    onValue(ref(db, 'results'), s => setResults(s.val() || {}));
    onValue(ref(db, 'submittedData'), s => setSubmittedData(s.val() || {}));
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

        outcomeTotal++;
        if (bet.bet === actualOutcome) outcomeCorrect++;

        scoreTotal++;
        if (bh === rh && ba === ra) scoreCorrect++;

        const home = bet.home;
        const away = bet.away;

        if (!teamStats[home]) teamStats[home] = { points: 0, cost: 0, total: 0 };
        if (!teamStats[away]) teamStats[away] = { points: 0, cost: 0, total: 0 };

        teamStats[home].total++;
        teamStats[away].total++;

        if (bet.bet === actualOutcome) {
          teamStats[home].points++;
          teamStats[away].points++;
        } else {
          teamStats[home].cost++;
          teamStats[away].cost++;
        }
      });

      const totalBets = outcomeTotal;

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      const OVR = Math.round((outcomeRate * 0.7 + scoreRate * 0.3) * 100);

      // -------------------------
      // TEAM INSIGHT
      // -------------------------
      const validTeams = Object.entries(teamStats)
        .filter(([_, v]) => v.total >= 3);

      const bestPointTeams = [...validTeams]
        .sort((a, b) => b[1].points - a[1].points)
        .slice(0, 3)
        .map(([team]) => team);

      const worstPointTeams = [...validTeams]
        .sort((a, b) => b[1].cost - a[1].cost)
        .slice(0, 3)
        .map(([team]) => team);

      // -------------------------
      // STYLE + VERDICT SYSTEM
      // -------------------------

      let style = "Zrównoważony analityk";
      let verdict = [];

      if (totalBets < 10) {
        style = "Nowy użytkownik";
        verdict.push("Zbyt mało danych do pełnej analizy.");
      } else {
        if (outcomeRate > 0.65 && scoreRate < 0.2) {
          style = "Taktyczny czytelnik meczu";
          verdict.push("Dobrze czytasz wyniki, ale rzadko trafiasz dokładny wynik.");
        } else if (scoreRate > 0.25) {
          style = "Łowca wyników";
          verdict.push("Ryzykowny styl — skupiasz się na dokładnych wynikach.");
        } else if (outcomeRate < 0.4) {
          style = "Ryzykowny typer";
          verdict.push("Niska skuteczność wyboru zwycięzców.");
        } else {
          style = "Zrównoważony analityk";
          verdict.push("Stabilny styl typowania.");
        }

        if (outcomeRate > 0.7) {
          verdict.push("Silna intuicja w typowaniu zwycięzców.");
        }

        if (scoreRate < 0.15) {
          verdict.push("Trudność w dokładnych wynikach — duża losowość.");
        }

        if (emptyBets > 5) {
          verdict.push("Częste brakujące typy wpływają na wynik analizy.");
        }
      }

      output.push({
        user,
        style,
        verdict,
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

  const pct = v => `${(v * 100).toFixed(1)}%`;

  return (
    <Container fluid style={{ background: '#121212', minHeight: '100vh', color: '#fff', padding: 12 }}>

      <Row>
        <Col>
          <h2 style={{ color: '#FFD700' }}>🏆 FIFA Betting Profiles</h2>
          <hr style={{ borderColor: '#FFD700' }} />
        </Col>
      </Row>

      <Row>
        <Col>

          {profiles.map((p, i) => (
            <div key={i} style={{
              background: '#1e1e1e',
              padding: 16,
              marginBottom: 20,
              borderRadius: 12,
              border: '1px solid #2a2a2a'
            }}>

              {/* NAME FIX */}
              <h2 style={{ color: '#FFD700' }}>👤 {p.user}</h2>

              <h3>🏆 {p.OVR} OVR</h3>
              <h4>{p.style}</h4>

              <p>🧠 Outcome: {pct(p.outcomeRate)}</p>
              <p>🎯 Score: {pct(p.scoreRate)}</p>

              <p>⚽ Teams giving points: {p.bestPointTeams.join(', ') || '---'}</p>
              <p>💔 Teams costing points: {p.worstPointTeams.join(', ') || '---'}</p>

              <div style={{ marginTop: 10, color: '#ccc' }}>
                <strong>📊 Scouting report:</strong>
                <ul>
                  {p.verdict.map((v, idx) => (
                    <li key={idx}>{v}</li>
                  ))}
                </ul>
              </div>

            </div>
          ))}

        </Col>
      </Row>

    </Container>
  );
};

export default Stats;