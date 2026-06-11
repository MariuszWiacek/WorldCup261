import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';

// Konfiguracja Firebase
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

      // 🧠 SYSTEM ANALIZY ZESPOŁÓW
      const teamStats = {};

      Object.entries(bets).forEach(([matchId, bet]) => {
        const result = results[matchId];
        if (!bet || !result) return;

        if (!bet.score || bet.score === ':::' || bet.score === ':') {
          emptyBets++;
          return;
        }

        const [rh, ra] = result.split(':').map(Number);
        const actualOutcome = rh === ra ? 'X' : rh > ra ? '1' : '2';

        const [bh, ba] = bet.score.split(':').map(Number);

        // --------------------
        // REZULTAT (1X2)
        // --------------------
        outcomeTotal++;
        if (bet.bet === actualOutcome) outcomeCorrect++;

        // --------------------
        // DOKŁADNY WYNIK
        // --------------------
        scoreTotal++;
        if (bh === rh && ba === ra) scoreCorrect++;

        // --------------------
        // STATYSTYKI DRUŻYN
        // --------------------
        const home = bet.home || "Nieznany";
        const away = bet.away || "Nieznany";

        if (!teamStats[home]) {
          teamStats[home] = { points: 0, cost: 0, total: 0 };
        }

        if (!teamStats[away]) {
          teamStats[away] = { points: 0, cost: 0, total: 0 };
        }

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

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      // 🏟️ KLASYFIKACJA STYLU TYPOWANIA
      let style = "Zrównoważony analityk";

      if (outcomeRate > 0.65 && scoreRate < 0.2) {
        style = "Taktyczny typer";
      } else if (scoreRate > 0.25) {
        style = "Łowca wyników";
      } else if (outcomeRate < 0.4) {
        style = "Chaotyczny typer";
      }

      // ⚽ FILTRACJA DRUŻYN (minimum 3 rozegrane mecze)
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

      // 🏆 RANKING OVR (W STYLU FIFA)
      const OVR = Math.round((outcomeRate * 0.7 + scoreRate * 0.3) * 100);

      output.push({
        user, 
        style,
        OVR,
        outcomeRate,
        scoreRate,
        outcomeCorrect,
        scoreCorrect,
        outcomeTotal,
        emptyBets,
        bestPointTeams,
        worstPointTeams
      });
    });

    // Sortowanie od najwyższego do najniższego OVR
    output.sort((a, b) => b.OVR - a.OVR);

    setProfiles(output);
  }, [submittedData, results]);

  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'sans-serif' }}>

      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', marginBottom: '20px', color: '#FFD700', textAlign: 'center' }}>
            <h2>🏆 Profile Typerów</h2>
            <p style={{ color: '#aaa' }}>Szczegółowa analiza tendencji i statystyk graczy</p>
            <hr style={{ borderColor: '#FFD700', width: '50%', margin: '10px auto' }} />
          </div>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>

          {profiles.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
                padding: '20px',
                marginBottom: '25px',
                borderRadius: '16px',
                border: '2px solid #2a2a2a',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              {/* Nagłówek: Nazwa użytkownika i ocena OVR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ margin: 0, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    👤 {p.user}
                  </h3>
                  <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {p.style}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ margin: 0, color: '#FFD700', fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>
                    {p.OVR}
                  </h1>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>OVR</span>
                </div>
              </div>

              {/* Blok statystyk głównych */}
              <Row style={{ marginBottom: '15px' }}>
                <Col xs={6}>
                  <div style={{ background: '#161616', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>🔮 TRAFIENIE 1X2</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4caf50' }}>{pct(p.outcomeRate)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>({p.outcomeCorrect}/{p.outcomeTotal} meczów)</div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div style={{ background: '#161616', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>🎯 DOKŁADNE WYNIKI</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2196f3' }}>{pct(p.scoreRate)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>({p.scoreCorrect} czystych trafień)</div>
                  </div>
                </Col>
              </Row>

              {/* Relacje z drużynami */}
              <div style={{ fontSize: '0.9rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                <div style={{ margin: '6px 0', color: '#ccc' }}>
                  <span style={{ color: '#4caf50', fontWeight: '600' }}>⚽ Szczęśliwe zespoły:</span> {p.bestPointTeams.join(', ') || 'Brak danych'}
                </div>
                <div style={{ margin: '6px 0', color: '#ccc' }}>
                  <span style={{ color: '#f44336', fontWeight: '600' }}>💔 Pechowe zespoły:</span> {p.worstPointTeams.join(', ') || 'Brak danych'}
                </div>
              </div>

              {/* Werdykt algorytmu */}
              <div style={{ 
                background: 'rgba(255, 215, 0, 0.04)', 
                padding: '12px', 
                borderRadius: '8px', 
                borderLeft: '4px solid #FFD700', 
                fontSize: '0.9rem',
                lineHeight: '1.45',
                color: '#ddd' 
              }}>
                <strong>🧠 Werdykt:</strong>{" "}
                {p.style === "Taktyczny typer" && "Świetnie przewidujesz, kto wygra lub zremisuje, ale brakuje Ci precyzji snajpera do trafiania idealnego rezultatu bramkowego. Stosujesz bezpieczną i skuteczną taktykę!"}
                {p.style === "Łowca wyników" && "Prawdziwy hazardzista premium! Masz niesamowity nos do idealnych wyników (np. 2:1, 0:0). Idziesz po całą pulę i nie zadowalasz się półśrodkami."}
                {p.style === "Zrównoważony analityk" && "Klasyczny styl menedżerski. Potrafisz idealnie wypośrodkować ryzyko między czystym wskazaniem faworyta a dokładnym wynikiem. Solidny gracz turniejowy."}
                {p.style === "Chaotyczny typer" && "Zupełnie nieprzewidywalna forma. Twoje typy potrafią mocno zaskoczyć zarówno algorytm, jak i samych piłkarzy na boisku. Potrzebujesz więcej stabilizacji formy!"}
              </div>

              {/* Stopka karty użytkownika */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '8px', borderTop: '1px dashed #333', fontSize: '0.75rem', color: '#777' }}>
                <span>Aktywne kupony: {p.outcomeTotal}</span>
                <span>Puste/nieoddane typy: {p.emptyBets}</span>
              </div>

            </div>
          ))}

        </Col>
      </Row>

    </Container>
  );
};

export default Stats;
