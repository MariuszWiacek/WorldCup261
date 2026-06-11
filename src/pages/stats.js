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
  
  // Stan na globalne statystyki ligi
  const [globalStats, setGlobalStats] = useState({
    mostDraws: { user: '---', count: 0 },
    mostExactScores: { user: '---', count: 0 },
    bestAccuracy: { user: '---', rate: 0 },
    mostEmpty: { user: '---', count: 0 }
  });

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
      let drawBetsCount = 0; 

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

        outcomeTotal++;
        if (bet.bet === actualOutcome) outcomeCorrect++;
        if (bet.bet === 'X') drawBetsCount++;

        scoreTotal++;
        if (bh === rh && ba === ra) scoreCorrect++;

        const home = bet.home || "Nieznany";
        const away = bet.away || "Nieznany";

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

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;
      const drawRate = outcomeTotal ? drawBetsCount / outcomeTotal : 0;

      // Słownik stylów
      let style = "Zrównoważony analityk";
      let verdict = "Klasyczny styl menedżerski. Potrafisz idealnie wypośrodkować ryzyko między czystym wskazaniem faworyta a dokładnym wynikiem. Solidny gracz turniejowy.";

      if (drawRate >= 0.25 && outcomeRate > 0.45) {
        style = "Król Remisów";
        verdict = "Gdzie inni widzą pewne trzy punkty dla faworyta, Ty czujesz zapach podziału punktów na kilometr. Masz niesamowitą intuicję do zaciętych meczów kończących się wynikiem 0:0 lub 1:1.";
      } else if (emptyBets > 10 && outcomeRate > 0.5) {
        style = "Ekspert Dezerter";
        verdict = "Masz ogromną wiedzę i świetną skuteczność, kiedy już... przypomnisz sobie o oddaniu typu. Gdyby nie puste kupony, demolowałbyś tę tabelę.";
      } else if (outcomeRate >= 0.75 && scoreRate >= 0.35) {
        style = "Legenda Typerów (FUT Icon)";
        verdict = "Absolutny kosmos. Czytasz mecze jak otwartą księgę. Twoje statystyki budzą strach i zazdrość w całej lidze – grasz na poziomie profesjonalnego analityka.";
      } else if (outcomeRate > 0.65 && scoreRate < 0.12) {
        style = "Taktyczny bezpiecznik";
        verdict = "Genialnie przewidujesz, kto zdobędzie punkty, ale unikasz ryzyka i nie potrafisz wstrzelić się w dokładne bramki. Twój minimalizm pozwala zbierać punkty powoli, ale stabilnie.";
      } else if (scoreRate >= 0.30) {
        style = "Snajper Dokładności";
        verdict = "Prawdziwy chirurg precyzji! Polujesz na wysokie kursy i wysokie ryzyko, trafiając dokładne rezultaty bramkowe tam, gdzie inni gubią punkty.";
      } else if (outcomeRate < 0.40 && scoreRate > 0.15) {
        style = "Szalony Wizjoner";
        verdict = "Mylisz się w podstawowych, oczywistych meczach, po czym bez problemu trafiasz dokładny wynik meczu, w którym skazywano underdogów na pożarcie.";
      } else if (outcomeRate < 0.38 && scoreRate <= 0.08) {
        style = "Generator Losowości";
        verdict = "Twoja forma to totalny rollercoaster. Wygląda na to, że typujesz wyniki rzutem monetą. Przeciwnicy nigdy nie wiedzą, czego się spodziewać.";
      } else if (emptyBets > 15) {
        style = "Duch Turnieju";
        verdict = "Więcej meczów oddajesz walkowerem niż realnie analizujesz. Liga wciąż jednak wierzy w Twój wielki powrót w końcówce turnieju!";
      }

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 3);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      const OVR = Math.round((outcomeRate * 0.7 + scoreRate * 0.3) * 100);

      output.push({
        user, style, verdict, OVR, outcomeRate, scoreRate,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsCount,
        bestPointTeams, worstPointTeams
      });
    });

    output.sort((a, b) => b.OVR - a.OVR);
    setProfiles(output);

    // ==========================================
    // CALKOWANIE I WYCIĄGANIE STATYSTYK GLOBALNYCH
    // ==========================================
    if (output.length > 0) {
      const mostDraws = [...output].sort((a, b) => b.drawBetsCount - a.drawBetsCount)[0];
      const mostExactScores = [...output].sort((a, b) => b.scoreCorrect - a.scoreCorrect)[0];
      const bestAccuracy = [...output].sort((a, b) => b.outcomeRate - a.outcomeRate)[0];
      const mostEmpty = [...output].sort((a, b) => b.emptyBets - a.emptyBets)[0];

      setGlobalStats({
        mostDraws: { user: mostDraws.user, count: mostDraws.drawBetsCount },
        mostExactScores: { user: mostExactScores.user, count: mostExactScores.scoreCorrect },
        bestAccuracy: { user: bestAccuracy.user, rate: bestAccuracy.outcomeRate },
        mostEmpty: { user: mostEmpty.user, count: mostEmpty.emptyBets }
      });
    }

  }, [submittedData, results]);

  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'sans-serif' }}>

      {/* Nagłówek Główny */}
      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', marginBottom: '20px', color: '#FFD700', textAlign: 'center' }}>
            <h2>🏆 Zaawansowane Profile Typerów FIFA</h2>
            <hr style={{ borderColor: '#FFD700', width: '30%', margin: '10px auto' }} />
          </div>
        </Col>
      </Row>

      {/* ==========================================
          SEKCJA NOWA: PODSUMOWANIE OGÓLNE LIGI
          ========================================== */}
      <Row className="justify-content-center" style={{ marginBottom: '30px' }}>
        <Col xs={12} md={8} lg={6}>
          <div style={{ background: '#1c1a12', border: '1px solid #FFD700', borderRadius: '14px', padding: '18px', boxShadow: '0 0 15px rgba(255,215,0,0.1)' }}>
            <h5 style={{ color: '#FFD700', margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', textAlign: 'center' }}>
              📊 LIDERZY STATYSTYK GLOBALNYCH
            </h5>
            
            <Row style={{ fontSize: '0.88rem' }}>
              <Col xs={6} style={{ marginBottom: '12px' }}>
                <div style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold' }}>🤝 NAJWIĘCEJ REMISÓW</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem' }}>{globalStats.mostDraws.user}</div>
                <div style={{ color: '#FFD700' }}>{globalStats.mostDraws.count} wytypowanych</div>
              </Col>
              
              <Col xs={6} style={{ marginBottom: '12px' }}>
                <div style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold' }}>🎯 DOKŁADNE WYNIKI</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem' }}>{globalStats.mostExactScores.user}</div>
                <div style={{ color: '#2196f3' }}>{globalStats.mostExactScores.count} trafionych</div>
              </Col>
              
              <Col xs={6}>
                <div style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold' }}>🔮 INTUICJA (1X2)</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem' }}>{globalStats.bestAccuracy.user}</div>
                <div style={{ color: '#4caf50' }}>Skuteczność: {pct(globalStats.bestAccuracy.rate)}</div>
              </Col>
              
              <Col xs={6}>
                <div style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold' }}>💤 ZAPOMINALSKI</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem' }}>{globalStats.mostEmpty.user}</div>
                <div style={{ color: '#f44336' }}>{globalStats.mostEmpty.count} pustych kuponów</div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Sekcja kart użytkowników */}
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
                    <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>🔮 SKUTECZNOŚĆ 1X2</div>
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
                  <span style={{ color: '#4caf50', fontWeight: '600' }}>⚽ Zarabiasz na:</span> {p.bestPointTeams.join(', ') || 'Brak stabilnych danych'}
                </div>
                <div style={{ margin: '6px 0', color: '#ccc' }}>
                  <span style={{ color: '#f44336', fontWeight: '600' }}>💔 Tracisz przez:</span> {p.worstPointTeams.join(', ') || 'Brak stabilnych danych'}
                </div>
              </div>

              {/* Dynamiczny Werdykt algorytmu */}
              <div style={{ 
                background: 'rgba(255, 215, 0, 0.04)', 
                padding: '12px', 
                borderRadius: '8px', 
                borderLeft: '4px solid #FFD700', 
                fontSize: '0.9rem',
                lineHeight: '1.45',
                color: '#ddd' 
              }}>
                <strong>🧠 Werdykt systemu:</strong> {p.verdict}
              </div>

              {/* Stopka karty użytkownika */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '8px', borderTop: '1px dashed #333', fontSize: '0.75rem', color: '#777' }}>
                <span>Wytypowane remisy: {p.drawBetsCount}</span>
                <span>Opuszczone mecze: {p.emptyBets}</span>
              </div>

            </div>
          ))}

        </Col>
      </Row>

    </Container>
  );
};

export default Stats;
