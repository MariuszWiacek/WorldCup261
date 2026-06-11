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
  
  // Stany widoczności poszczególnych kafelków liderów
  const [showKingOfDraws, setShowKingOfDraws] = useState(false);
  const [showMostEmpty, setShowMostEmpty] = useState(false);

  // Stan na globalne statystyki ligi
  const [globalStats, setGlobalStats] = useState({
    mostDrawsPredicted: { user: '---', count: 0 },
    kingOfDraws: { user: '---', count: 0 },
    mostExactScores: { user: '---', count: 0 },
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
      let drawBetsPredicted = 0; 
      let drawBetsCorrect = 0;   

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
        if (bet.bet === actualOutcome) {
          outcomeCorrect++;
          if (bet.bet === 'X') drawBetsCorrect++;
        }
        
        if (bet.bet === 'X') drawBetsPredicted++;

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

      // ==========================================
      // 🏟️ HUMORYSTYCZNE PROFILE I WERDYKTY (BEZ FIFA)
      // ==========================================
      let style = "Kalkulujący Profesor";
      let verdict = "Nuda, stabilizacja i zero szaleństwa. Grasz jak stary, doświadczony ligowiec, który zamiast widowiska woli brzydkie, ale pewne punkty. Bukmacherzy nienawidzą Twojego wyrachowania.";

      if (drawBetsCorrect >= 4) {
        style = "Król Remisów";
        verdict = "Gdzie inni widzą pewne trzy punkty dla faworyta, Ty bezbłędnie wyczuwasz zapach nudnego 0:0 na odległość kilometra. Masz nosa do morderczych meczów walki, w których nikt nie chce wygrać.";
      } else if (emptyBets > 10 && outcomeRate > 0.5) {
        style = "Ekspert Dezerter";
        verdict = "Wiedza ekspercka jest, intuicja też, tylko co z tego, skoro budzik na wysyłanie kuponów dzwoni u Ciebie trzy godziny po meczu? Gdyby nie te uciekające walkowery, reszta tabeli mogłaby już zwijać manatki.";
      } else if (outcomeRate >= 0.75 && scoreRate >= 0.35) {
        style = "Absolutny Geniusz Tabeli";
        verdict = "Zgłoś się do jakiejś telewizji, bo marnujesz się w naszej amatorskiej lidze. Czytasz intencje zawodników szybciej niż ich własni trenerzy. Podejrzanie często trafiasz – czy na pewno nie masz układów z sędziami?";
      } else if (outcomeRate > 0.65 && scoreRate < 0.12) {
        style = "Kolekcjoner Minimalizmu";
        verdict = "Wiesz, kto wygra, ale ustrzelenie dokładnego wyniku bramkowego graniczy u Ciebie z cudem. Grasz tak bezpiecznie, że nawet na wakacje pewnie jedziesz w kasku. Punkty kapią powoli, ale sumiennie.";
      } else if (scoreRate >= 0.30) {
        style = "Chirurg Wyników";
        verdict = "Rzadko trafiasz ogólny rezultat, ale jak już w coś bębniesz, to z dokładnością do centymetra! Polujesz wyłącznie na grube i skomplikowane wyniki. Prawdziwy snajper bezlitosnej precyzji.";
      } else if (outcomeRate < 0.40 && scoreRate > 0.15) {
        style = "Szalony Jasnowidz";
        verdict = "Kompletny paradoks. Potrafisz koncertowo wyłożyć się na murowanym faworycie, żeby godzinę później bez mrugnięcia okiem trafić kosmiczny, dokładny wynik meczu skazywanych na pożarcie underdogów.";
      } else if (outcomeRate < 0.38 && scoreRate <= 0.08) {
        // ZOSTAWIENI PROFILE DLA KUZYNA (ZGODNIE Z PROŚBĄ)
        style = "Chaotyczny typer";
        verdict = "Zupełnie nieprzewidywalna forma. Twoje typy potrafią zaskoczyć zarówno algorytm, jak i samych piłkarzy. Potrzebujesz więcej stabilizacji!";
      } else if (emptyBets > 15) {
        style = "Mityczna Istota";
        verdict = "Twoje konto w tabeli pokryło się już metrową warstwą kurzu. Więcej meczów oddajesz walkowerem niż realnie typujesz. Podobno ktoś Cię kiedyś widział na trybunach, ale to niepotwierdzone plotki.";
      }

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 3);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      const OVR = Math.round((outcomeRate * 0.7 + scoreRate * 0.3) * 100);

      output.push({
        user, style, verdict, OVR, outcomeRate, scoreRate,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsPredicted, drawBetsCorrect,
        bestPointTeams, worstPointTeams
      });
    });

    output.sort((a, b) => b.OVR - a.OVR);
    setProfiles(output);

    // REKALKULACJA LIDERÓW Z FILTRAMI
    if (output.length > 0) {
      const mostDrawsPredicted = [...output].sort((a, b) => b.drawBetsPredicted - a.drawBetsPredicted)[0];
      const mostExactScores = [...output].sort((a, b) => b.scoreCorrect - a.scoreCorrect)[0];

      const sortedDraws = [...output].sort((a, b) => b.drawBetsCorrect - a.drawBetsCorrect);
      const topDrawCount = sortedDraws[0].drawBetsCorrect;
      const drawWinnersCount = sortedDraws.filter(p => p.drawBetsCorrect === topDrawCount).length;
      const isDrawKingValid = topDrawCount > 0 && drawWinnersCount === 1;
      setShowKingOfDraws(isDrawKingValid);

      const sortedEmpty = [...output].sort((a, b) => b.emptyBets - a.emptyBets);
      const topEmptyCount = sortedEmpty[0].emptyBets;
      const emptyWinnersCount = sortedEmpty.filter(p => p.emptyBets === topEmptyCount).length;
      const isSubmittingGhostValid = topEmptyCount > 0 && emptyWinnersCount === 1;
      setShowMostEmpty(isSubmittingGhostValid);

      setGlobalStats({
        mostDrawsPredicted: { user: mostDrawsPredicted.user, count: mostDrawsPredicted.drawBetsPredicted },
        kingOfDraws: { user: sortedDraws[0].user, count: topDrawCount },
        mostExactScores: { user: mostExactScores.user, count: mostExactScores.scoreCorrect },
        mostEmpty: { user: sortedEmpty[0].user, count: topEmptyCount }
      });
    }

  }, [submittedData, results]);

  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  let activeCards = 2; 
  if (showKingOfDraws) activeCards++;
  if (showMostEmpty) activeCards++;
  const colSize = Math.floor(12 / activeCards);

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'sans-serif' }}>

      {/* Nagłówek Główny */}
      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', marginBottom: '20px', color: '#FFD700', textAlign: 'center' }}>
            <h2>🏆 Zaawansowane Profile Typerów</h2>
            <hr style={{ borderColor: '#FFD700', width: '30%', margin: '10px auto' }} />
          </div>
        </Col>
      </Row>

      {/* STATYSTYKI GLOBALNE LIGI */}
      <Row className="justify-content-center" style={{ marginBottom: '30px' }}>
        <Col xs={12} md={10} lg={8}>
          <div style={{ background: '#1c1a12', border: '1px solid #FFD700', borderRadius: '14px', padding: '18px', boxShadow: '0 0 15px rgba(255,215,0,0.1)' }}>
            <h5 style={{ color: '#FFD700', margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', textAlign: 'center' }}>
              📊 STATYSTYKI GLOBALNE LIGI
            </h5>
            
            <Row style={{ fontSize: '0.85rem' }}>
              <Col xs={colSize} style={{ marginBottom: '12px', borderRight: '1px solid #2a2a2a' }}>
                <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>🔮 NAJWIĘCEJ WYTYPOWANYCH REMISÓW</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', marginTop: '4px' }}>{globalStats.mostDrawsPredicted.user}</div>
                <div style={{ color: '#9e9e9e', fontSize: '0.8rem' }}>{globalStats.mostDrawsPredicted.count} razy postawił "X"</div>
              </Col>

              {showKingOfDraws && (
                <Col xs={colSize} style={{ marginBottom: '12px', borderRight: '1px solid #2a2a2a' }}>
                  <div style={{ color: '#FFD700', fontSize: '0.7rem', fontWeight: 'bold' }}>👑 OFICJALNY KRÓL REMISÓW</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', marginTop: '4px' }}>{globalStats.kingOfDraws.user}</div>
                  <div style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.8rem' }}>{globalStats.kingOfDraws.count} trafionych remisów</div>
                </Col>
              )}
              
              <Col xs={colSize} style={{ marginBottom: '12px', borderRight: showMostEmpty ? '1px solid #2a2a2a' : 'none' }}>
                <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>🎯 CZUŁE OKO (DOKŁADNE WYNIKI)</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', marginTop: '4px' }}>{globalStats.mostExactScores.user}</div>
                <div style={{ color: '#2196f3', fontSize: '0.8rem' }}>{globalStats.mostExactScores.count} razy w punkt</div>
              </Col>
              
              {showMostEmpty && (
                <Col xs={colSize} style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>💤 NAJWIĘKSZY ZAPOMINALSKI (:::)</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', marginTop: '4px' }}>{globalStats.mostEmpty.user}</div>
                  <div style={{ color: '#f44336', fontSize: '0.8rem' }}>{globalStats.mostEmpty.count} pustych typów</div>
                </Col>
              )}
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
              {/* Nagłówek karty */}
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

              {/* Dynamiczny Werdykt */}
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
                <span>Remisy (Wytypowane / TRAFIONE): {p.drawBetsPredicted} / <strong style={{ color: '#FFD700' }}>{p.drawBetsCorrect}</strong></span>
                <span>Puste typy (:::): {p.emptyBets}</span>
              </div>

            </div>
          ))}

        </Col>
      </Row>

    </Container>
  );
};

export default Stats;
