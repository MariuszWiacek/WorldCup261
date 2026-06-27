import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import VERDICTS_BANK from '../gameData/verdictsBank.json'; // Import z zewnętrznego pliku JSON

// Configuration Firebase
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

const getStableSeed = (str) => {
  let hash = 1789;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
};

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [profiles, setProfiles] = useState([]);
  
  const [showKingOfDraws, setShowKingOfDraws] = useState(false);
  const [showMostEmpty, setShowMostEmpty] = useState(false);

  const [globalStats, setGlobalStats] = useState({
    mostDrawsPredicted: { users: '---', count: 0 },
    kingOfDraws: { users: '---', count: 0 },
    mostExactScores: { users: '---', count: 0 },
    mostEmpty: { users: '---', count: 0 }
  });

  useEffect(() => {
    const unsubResults = onValue(ref(db, 'results'), snap => {
      if (snap.exists()) setResults(snap.val());
    });
    const unsubData = onValue(ref(db, 'submittedData'), snap => {
      if (snap.exists()) setSubmittedData(snap.val());
    });
    return () => {
      unsubResults();
      unsubData();
    };
  }, []);

  useEffect(() => {
    if (!submittedData || Object.keys(submittedData).length === 0 || !results || Object.keys(results).length === 0) {
      return;
    }

    const rawProfiles = [];
    let absoluteMaxDrawsCorrect = 0;
    let absoluteMaxExactScores = 0;
    let absoluteMaxOutcomeCorrect = 0;

    const playedMatchesCount = Object.values(results).filter(res => {
      if (!res) return false;
      const resString = typeof res === 'object' ? String(res.score || '') : String(res);
      return resString.includes(':') && resString.trim() !== '';
    }).length;

    const currentMatchesBase = playedMatchesCount > 0 ? playedMatchesCount : 1;

    Object.keys(submittedData).forEach((user, index) => {
      const bets = submittedData[user] || {};

      let outcomeCorrect = 0;
      let outcomeTotal = 0;
      let scoreCorrect = 0;
      let scoreTotal = 0;
      let emptyBets = 0;
      let drawBetsPredicted = 0; 
      let drawBetsCorrect = 0;   
      let calculatedPoints = 0;

      const teamStats = {};

      Object.entries(bets).forEach(([matchId, bet]) => {
        if (!bet) return;

        const scoreStr = String(bet.score || '');
        if (!scoreStr || scoreStr === ':::' || scoreStr === ':' || scoreStr.trim() === '') {
          emptyBets++;
          return;
        }

        const rawResult = results[matchId];
        if (!rawResult) return;

        let finalResultString = '';
        if (typeof rawResult === 'object' && rawResult.score) {
          finalResultString = String(rawResult.score);
        } else if (typeof rawResult === 'string') {
          finalResultString = rawResult;
        } else {
          return;
        }

        if (!finalResultString.includes(':')) return;

        const resParts = finalResultString.split(':');
        let rh, ra;
        if (resParts.length >= 3) {
          rh = Number(resParts[resParts.length - 2]);
          ra = Number(resParts[resParts.length - 1]);
        } else {
          rh = Number(resParts[0]);
          ra = Number(resParts[1]);
        }
        if (isNaN(rh) || isNaN(ra)) return;

        const actualOutcome = rh === ra ? 'X' : rh > ra ? '1' : '2';

        if (!scoreStr.includes(':')) return;
        const betParts = scoreStr.split(':');
        const bh = Number(betParts[0]);
        const ba = Number(betParts[1]);
        if (isNaN(bh) || isNaN(ba)) return;

        outcomeTotal++;
        scoreTotal++;

        let matchPointsEarned = 0;
        
        if (bh === rh && ba === ra) {
          scoreCorrect++;
          matchPointsEarned = 3; 
          if (actualOutcome === 'X') drawBetsCorrect++;
          outcomeCorrect++; 
        } else if (String(bet.bet).toUpperCase() === actualOutcome) {
          outcomeCorrect++;
          matchPointsEarned = 1; 
          if (actualOutcome === 'X') drawBetsCorrect++;
        }
        
        calculatedPoints += matchPointsEarned;

        const predictedOutcome = String(bet.bet).toUpperCase();
        if (predictedOutcome === 'X') drawBetsPredicted++;

        let tHome = bet.home || (matchId.includes('_') ? matchId.split('_')[0] : null);
        let tAway = bet.away || (matchId.includes('_') ? matchId.split('_')[1] : null);

        if (!tHome || !tAway) {
          tHome = "Klub H_" + matchId;
          tAway = "Klub A_" + matchId;
        }

        if (!teamStats[tHome]) teamStats[tHome] = { pointsEarned: 0, matchesBlown: 0 };
        if (!teamStats[tAway]) teamStats[tAway] = { pointsEarned: 0, matchesBlown: 0 };

        if (matchPointsEarned > 0) {
          if (predictedOutcome === '1') {
            teamStats[tHome].pointsEarned += matchPointsEarned;
          } else if (predictedOutcome === '2') {
            teamStats[tAway].pointsEarned += matchPointsEarned;
          }
        } else {
          if (predictedOutcome === '1') {
            teamStats[tHome].matchesBlown += 1;
          } else if (predictedOutcome === '2') {
            teamStats[tAway].matchesBlown += 1;
          } else if (predictedOutcome === 'X') {
            if (actualOutcome === '1') teamStats[tAway].matchesBlown += 1;
            if (actualOutcome === '2') teamStats[tHome].matchesBlown += 1;
          }
        }
      });

      if (drawBetsCorrect > absoluteMaxDrawsCorrect) absoluteMaxDrawsCorrect = drawBetsCorrect;
      if (scoreCorrect > absoluteMaxExactScores) absoluteMaxExactScores = scoreCorrect;
      if (outcomeCorrect > absoluteMaxOutcomeCorrect) absoluteMaxOutcomeCorrect = outcomeCorrect;

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      const validTeams = Object.entries(teamStats).filter(([name]) => !name.startsWith("Klub "));
      
      const activeEarners = validTeams.filter(([_, v]) => v.pointsEarned > 0);
      let bestPointTeams = [];
      if (activeEarners.length > 0) {
        const maxEarned = Math.max(...activeEarners.map(([_, v]) => v.pointsEarned));
        const absoluteTopEarners = activeEarners.filter(([_, v]) => v.pointsEarned === maxEarned);
        
        bestPointTeams = absoluteTopEarners.slice(0, 5).map(([team]) => `${team}`);
        if (absoluteTopEarners.length > 5) bestPointTeams.push("i inne...");
      }

      const activeLosers = validTeams.filter(([_, v]) => v.matchesBlown > 0);
      let worstPointTeams = [];
      if (activeLosers.length > 0) {
        const maxBlown = Math.max(...activeLosers.map(([_, v]) => v.matchesBlown));
        const absoluteTopLosers = activeLosers.filter(([_, v]) => v.matchesBlown === maxBlown);
        
        worstPointTeams = absoluteTopLosers.slice(0, 5).map(([team, v]) => `${team} (${v.matchesBlown}x)`);
        if (absoluteTopLosers.length > 5) worstPointTeams.push("i inne...");
      }

      rawProfiles.push({
        user, index, outcomeRate, scoreRate, calculatedPoints,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsPredicted, drawBetsCorrect,
        bestPointTeams, worstPointTeams
      });
    });

    const usedVerdicts = new Set();

    const output = rawProfiles.map(p => {
      let OVR = 0;
      if (p.outcomeTotal === 0) {
        OVR = 10;
      } else {
        const maxPossiblePoints = p.outcomeTotal * 3;
        const performanceRatio = p.calculatedPoints / maxPossiblePoints;

        let baseOvr = (performanceRatio / 0.45) * 100;

        const missedMatchesInCurrentPool = currentMatchesBase - p.outcomeTotal;
        if (missedMatchesInCurrentPool > 0) {
          baseOvr -= (missedMatchesInCurrentPool * 2.5);
        }

        OVR = Math.max(1, Math.min(Math.round(baseOvr), 99));
      }

      let basket = "braz";
      if (p.emptyBets > 15 || OVR < 40){
        basket = "mul"; 
      } else if (OVR >= 55
      ) { 
        basket = "zloto";
      } else if (OVR >= 48) { 
        basket = "srebro";
      } else {
        basket = "braz"; 
      }

      let style = "";
      let verdict = "";
      
      if (p.scoreCorrect === absoluteMaxExactScores && p.scoreCorrect > 0 && OVR >= 48 && !usedVerdicts.has("Chirurg Wyników (Snajper)")) {
        style = "Chirurg Wyników (Snajper)";
        verdict = `Niewiarygodne! Masz najwięcej idealnie trafionych wyników w lidze (${p.scoreCorrect}). Podczas gdy reszta bawi się w drobne, Ty wjeżdżasz z buta i kasujesz pakiety po 3 punkty. Strach z Tobą grać.`;
        usedVerdicts.add(style);
      }
      else if (p.outcomeCorrect === absoluteMaxOutcomeCorrect && p.outcomeCorrect > 0 && OVR >= 48 && !usedVerdicts.has("Analityk Trendów (Mózg Ligi)")) {
        style = "Analityk Trendów (Mózg Ligi)";
        verdict = `Twoje wyczucie boiskowych intencji jest przerażające. Masz najwięcej bezbłędnie wytypowanych tendencji (${p.outcomeCorrect}). Twój wewnętrzny algorytm rzadko kiedy się myli!`;
        usedVerdicts.add(style);
      }
      else if (p.drawBetsCorrect === absoluteMaxDrawsCorrect && p.drawBetsCorrect > 0 && !usedVerdicts.has("Oficjalny Król Remisów")) {
        style = "Oficjalny Król Remisów";
        verdict = `Podczas gdy cała liga ślepo stawia na faworytów, Ty ze stoickim spokojem namierzasz nudne mecze bez rozstrzygnięcia. Twój nos do 'iksów' ratuje Ci skórę w tabeli.`;
        usedVerdicts.add(style);
      } 
      else {
        const currentPool = VERDICTS_BANK[basket];
        const stableSeed = getStableSeed(p.user) + p.calculatedPoints;
        
        let poolIndex = stableSeed % currentPool.length;
        let item = currentPool[poolIndex];

        let attempts = 0;
        while (usedVerdicts.has(item.s) && attempts < currentPool.length) {
          poolIndex = (poolIndex + 1) % currentPool.length;
          item = currentPool[poolIndex];
          attempts++;
        }

        if (usedVerdicts.has(item.s)) {
          style = `${item.s} #${p.index + 1}`; 
          verdict = item.v;
        } else {
          style = item.s;
          verdict = item.v;
          usedVerdicts.add(item.s);
        }
      }

      return { ...p, OVR, style, verdict, basket };
    });

    output.sort((a, b) => b.OVR - a.OVR);
    setProfiles(output);

    if (output.length > 0) {
      const maxDrawsPred = Math.max(...output.map(p => p.drawBetsPredicted));
      const usersMostDrawsPred = output.filter(p => p.drawBetsPredicted === maxDrawsPred).map(p => p.user).join(', ');

      const maxDrawsCorr = Math.max(...output.map(p => p.drawBetsCorrect));
      const usersKingOfDraws = output.filter(p => p.drawBetsCorrect === maxDrawsCorr).map(p => p.user).join(', ');
      setShowKingOfDraws(maxDrawsCorr > 0);

      const maxExact = Math.max(...output.map(p => p.scoreCorrect));
      const usersMostExact = output.filter(p => p.scoreCorrect === maxExact).map(p => p.user).join(', ');

      const maxEmpty = Math.max(...output.map(p => p.emptyBets));
      const usersMostEmpty = output.filter(p => p.emptyBets === maxEmpty).map(p => p.user).join(', ');
      setShowMostEmpty(maxEmpty > 0);

      setGlobalStats({
        mostDrawsPredicted: { users: usersMostDrawsPred || '---', count: maxDrawsPred },
        kingOfDraws: { users: usersKingOfDraws || '---', count: maxDrawsCorr },
        mostExactScores: { users: usersMostExact || '---', count: maxExact },
        mostEmpty: { users: usersMostEmpty || '---', count: maxEmpty }
      });
    }

  }, [submittedData, results]);

  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  let activeCards = 2; 
  if (showKingOfDraws) activeCards++;
  if (showMostEmpty) activeCards++;
  const colSize = Math.floor(12 / activeCards);

  if (profiles.length === 0) {
    return (
      <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FFD700' }}>
        <h3>⏳ Wczytywanie i szydercze przeliczanie formy...</h3>
      </Container>
    );
  }

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'sans-serif' }}>
      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ color: '#FFD700', textTransform: 'uppercase', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px', margin: '0' }}>
     <hr></hr> 🏆 Loża Ekspertów i Szyderców MŚ<hr></hr>
    </h2>
    <div style={{ color: '#ff4d4d', fontSize: '0.95rem', marginTop: '8px', fontWeight: '600', letterSpacing: '0.5px' }}>
      * Brutalne fakty i czysta szydera. Słabeusze zostają w szatni.
    </div>
            <hr style={{ borderColor: '#FFD700', width: '30%', margin: '12px auto 10px auto' }} />
          </div>
        </Col>
      </Row>

     <Row className="justify-content-center" style={{ marginBottom: '40px' }}>
  <Col xs={12} md={8} lg={6}>
    
    <h5 style={{ color: '#FFD700', textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '20px' }}>
      📊 Mundialowe Rekordy Ligi
    </h5>
    
    <div>
      {/* 1. TYPY NA REMIS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '500' }}>Najwięcej typów na remis</div>
          <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{globalStats.mostDrawsPredicted.users}</div>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#FFD700' }}>
          {globalStats.mostDrawsPredicted.count} x "X"
        </div>
      </div>

      {/* 2. TRAFIONE REMISY */}
      {showKingOfDraws && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: '#00e5ff', fontSize: '0.9rem', fontWeight: '500' }}>Król remisów (Trafione)</div>
            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{globalStats.kingOfDraws.users}</div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#00e5ff' }}>
            {globalStats.kingOfDraws.count} trafień
          </div>
        </div>
      )}
      
      {/* 3. DOKŁADNE WYNIKI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ color: '#2196f3', fontSize: '0.9rem', fontWeight: '500' }}>Najwięcej dokładnych wyników</div>
          <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{globalStats.mostExactScores.users}</div>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#2196f3' }}>
          {globalStats.mostExactScores.count} x
        </div>
      </div>
      
      {/* 4. WALKOWERY */}
      {showMostEmpty && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px' }}>
          <div>
            <div style={{ color: '#ff4d4d', fontSize: '0.9rem', fontWeight: '500' }}>Niedokończone kupony</div>
            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{globalStats.mostEmpty.users}</div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#ff4d4d' }}>
            {globalStats.mostEmpty.count} w.o.
          </div>
        </div>
      )}
    </div>

  </Col>
</Row>

      {/* USER CARDS */}
      <Row className="justify-content-center">
         <div style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ color: '#FFD700', textTransform: 'uppercase', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px', margin: '0' }}>
     <hr></hr> Statystyki indywidualne<hr></hr>
    </h2></div>
        <Col xs={12} md={8} lg={6}>
          {profiles.map((p, idx) => {
            let cardBorder = '1px solid #2a2a2a';
            let ovrColor = '#FFD700';
            let verdictBg = 'rgba(255, 215, 0, 0.04)';
            let accentColor = '#FFD700';

            if (p.style.includes("Chirurg Wyników")) {
              cardBorder = '2px solid #2196f3';
              ovrColor = '#2196f3';
              verdictBg = 'rgba(33, 150, 243, 0.06)';
              accentColor = '#2196f3';
            } else if (p.style.includes("Analityk Trendów")) {
              cardBorder = '2px solid #4caf50';
              ovrColor = '#4caf50';
              verdictBg = 'rgba(76, 175, 80, 0.06)';
              accentColor = '#4caf50';
            } else if (p.style.includes("Oficjalny Król Remisów")) {
              cardBorder = '2px solid #00e5ff';
              ovrColor = '#00e5ff';
              verdictBg = 'rgba(0, 229, 255, 0.05)';
              accentColor = '#00e5ff';
            } else if (p.basket === "zloto") {
              cardBorder = '2px solid #FFD700';
              ovrColor = '#FFD700';
              verdictBg = 'rgba(255, 215, 0, 0.05)';
            } else if (p.basket === "srebro") {
              cardBorder = '2px solid #c0c0c0';
              ovrColor = '#c0c0c0';
              verdictBg = 'rgba(192, 192, 192, 0.05)';
              accentColor = '#c0c0c0';
            } else if (p.basket === "mul") {
              cardBorder = '2px dashed #ff4d4d';
              ovrColor = '#ff4d4d';
              verdictBg = 'rgba(255, 77, 77, 0.05)';
              accentColor = '#ff4d4d';
            }

            return (
              <div
                key={idx}
                style={{
                  background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
                  padding: '20px',
                  marginBottom: '25px',
                  borderRadius: '16px',
                  border: cardBorder,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                  <div style={{ flexGrow: 1 }}>
                    <h3 style={{ margin: 0, color: p.basket === "mul" ? '#ff4d4d' : '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      👤 {p.user}
                    </h3>
                    <span style={{ color: accentColor, fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {p.style}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ margin: 0, color: ovrColor, fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>
                      {p.OVR}
                    </h1>
                    <span style={{ fontSize: '0.75rem', color: '#88', textTransform: 'uppercase' }}>OVR</span>
                  </div>
                </div>

                <Row style={{ marginBottom: '15px' }}>
                  <Col xs={6}>
                    <div style={{ background: '#161616', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>🔮 SKUTECZNOŚĆ 1X2</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4caf50' }}>{pct(p.outcomeRate)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>({p.outcomeCorrect}/{p.outcomeTotal} m.)</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div style={{ background: '#161616', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>🎯 DOKŁADNE WYNIKI</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2196f3' }}>{pct(p.scoreRate)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{p.scoreCorrect}</div>
                    </div>
                  </Col>
                </Row>

                <div style={{ fontSize: '0.9rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                  <div style={{ margin: '6px 0', color: '#ccc' }}>
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>🟢 Najlepiej punktują:</span> {p.bestPointTeams.join(', ') || 'Brak danych'}
                  </div>
                  <div style={{ margin: '6px 0', color: '#ccc' }}>
                    <span style={{ color: '#f44336', fontWeight: '600' }}>🔴 Zawodzą:</span> {p.worstPointTeams.join(', ') || 'Brak danych'}
                  </div>
                </div>

                <div style={{ 
                  background: verdictBg, 
                  padding: '12px', 
                  borderRadius: '8px', 
                  borderLeft: `4px solid ${accentColor}`, 
                  fontSize: '0.9rem',
                  lineHeight: '1.45',
                  color: '#ddd' 
                }}>
                  <strong>🧠 Werdykt systemu:</strong> {p.verdict}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '8px', borderTop: '1px dashed #333', fontSize: '0.75rem', color: '#777' }}>
                  <span>Punkty: <strong style={{ color: '#4caf50' }}>{p.calculatedPoints} pkt</strong></span>
                  <span>Puste typy: {p.emptyBets}</span>
                </div>
              </div>
            );
          })}
        </Col>
      </Row>
    </Container>
  );
};

export default Stats;