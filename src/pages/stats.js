import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';

// 🔌 Firebase — tu zaczyna się cała zabawa (i potencjalne bugi 😄)
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

  const [showKingOfDraws, setShowKingOfDraws] = useState(false);
  const [showMostEmpty, setShowMostEmpty] = useState(false);

  const [globalStats, setGlobalStats] = useState({
    mostDrawsPredicted: { users: '---', count: 0 },
    kingOfDraws: { users: '---', count: 0 },
    mostExactScores: { users: '---', count: 0 },
    mostEmpty: { users: '---', count: 0 }
  });

  // 📡 Podpinamy realtime feed (czyli: kto właśnie się ośmiesza)
  useEffect(() => {
    const resultsRef = ref(db, 'results');
    const submittedRef = ref(db, 'submittedData');

    const unsubResults = onValue(resultsRef, snap =>
      setResults(snap.val() || {})
    );

    const unsubSubmitted = onValue(submittedRef, snap =>
      setSubmittedData(snap.val() || {})
    );

    // 🧹 Sprzątanie po Firebase (żeby nie było duchów listenerów 👻)
    return () => {
      unsubResults?.();
      unsubSubmitted?.();
    };
  }, []);

  // 🧠 Główna maszyna analityczna — tu rodzą się legendy i kompromitacje
  useEffect(() => {
    if (!submittedData || !results) return;

    const parseScore = (s = "") => {
      const clean = String(s).replace(/\s/g, '');
      const [a, b] = clean.split(':');
      return [Number(a), Number(b)];
    };

    const output = [];

    Object.keys(submittedData).forEach((user, index) => {
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

        // 💤 Puste typy — klasyczny „zapomniałem wysłać”
        if (!bet.score || bet.score === ':::' || bet.score === ':') {
          emptyBets++;
          return;
        }

        const [rh, ra] = parseScore(result);
        const [bh, ba] = parseScore(bet.score);

        const actualOutcome = rh === ra ? 'X' : rh > ra ? '1' : '2';

        outcomeTotal++;
        scoreTotal++;

        if (bet.bet === actualOutcome) {
          outcomeCorrect++;
          if (bet.bet === 'X') drawBetsCorrect++;
        }

        if (bet.bet === 'X') drawBetsPredicted++;

        if (bh === rh && ba === ra) {
          scoreCorrect++;
        }

        const tHome = bet.home || "Nieznany";
        const tAway = bet.away || "Nieznany";

        if (!teamStats[tHome]) teamStats[tHome] = { points: 0, cost: 0, total: 0 };
        if (!teamStats[tAway]) teamStats[tAway] = { points: 0, cost: 0, total: 0 };

        teamStats[tHome].total++;
        teamStats[tAway].total++;

        if (bet.bet === actualOutcome) {
          teamStats[tHome].points++;
          teamStats[tAway].points++;
        } else {
          teamStats[tHome].cost++;
          teamStats[tAway].cost++;
        }
      });

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      // 🎯 OVR — czyli jak bardzo możesz flexować na grupie
      const baseOVR = 45;
      const outcomeBonus = outcomeRate * 35;
      const exactBonus = scoreTotal ? (scoreCorrect / scoreTotal) * 20 : 0;

      const OVR = Math.min(
        Math.round(baseOVR + outcomeBonus + exactBonus),
        100
      );

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 2);

      const bestPointTeams = [...validTeams]
        .sort((a, b) => b[1].points - a[1].points)
        .slice(0, 3)
        .map(([team]) => team);

      const worstPointTeams = [...validTeams]
        .sort((a, b) => b[1].cost - a[1].cost)
        .slice(0, 3)
        .map(([team]) => team);

      const mainGoodTeam = bestPointTeams[0] || "reprezentacji";
      const mainBadTeam = worstPointTeams[0] || "faworytów";

      const drawPredictionRatio =
        outcomeTotal ? drawBetsPredicted / outcomeTotal : 0;

      // 🎲 Generator losowego upokorzenia (ale sprawiedliwy 😄)
      const seed =
        user.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
        index +
        OVR;

      let selectedPool = [];

      // 👻 brak aktywności
      if (emptyBets > 15) {
        selectedPool = [
          { s: "Ekspert widmo", v: "Zniknąłeś z turnieju szybciej niż VAR po kontrowersji." }
        ];
      } else {
        selectedPool =
          OVR >= 75
            ? [
                { s: "Mistrz analiz", v: `Grasz jakbyś znał wyniki przed meczem. ${mainGoodTeam} Cię niesie.` },
                { s: "Bukmacher killer", v: "Twoje typy robią straty gdzie się da." }
              ]
            : [
                { s: "Chaos kontrolowany", v: `Twoje decyzje są odważne... niestety dla tabeli. Winny: ${mainBadTeam}` },
                { s: "Generator losowości", v: "Tu logika bierze urlop." }
              ];
      }

      const variantIndex = selectedPool.length ? seed % selectedPool.length : 0;

      const style = selectedPool[variantIndex]?.s || "Niestabilny typer";
      const verdict =
        selectedPool[variantIndex]?.v ||
        "System nie był w stanie Cię sklasyfikować. To też wynik.";

      output.push({
        user,
        style,
        verdict,
        OVR,
        outcomeRate,
        scoreRate,
        outcomeCorrect,
        scoreCorrect,
        outcomeTotal,
        emptyBets,
        drawBetsPredicted,
        drawBetsCorrect,
        bestPointTeams,
        worstPointTeams
      });
    });

    output.sort((a, b) => b.OVR - a.OVR);
    setProfiles(output);

    if (output.length) {
      const maxDrawsPred = Math.max(...output.map(p => p.drawBetsPredicted));
      const maxDrawsCorr = Math.max(...output.map(p => p.drawBetsCorrect));
      const maxExact = Math.max(...output.map(p => p.scoreCorrect));
      const maxEmpty = Math.max(...output.map(p => p.emptyBets));

      const usersMostDrawsPred = output
        .filter(p => p.drawBetsPredicted === maxDrawsPred)
        .map(p => p.user)
        .join(', ');

      const usersKingOfDraws = output
        .filter(p => p.drawBetsCorrect === maxDrawsCorr)
        .map(p => p.user)
        .join(', ');

      const usersMostExact = output
        .filter(p => p.scoreCorrect === maxExact)
        .map(p => p.user)
        .join(', ');

      const usersMostEmpty = output
        .filter(p => p.emptyBets === maxEmpty)
        .map(p => p.user)
        .join(', ');

      setShowKingOfDraws(maxDrawsCorr > 0);
      setShowMostEmpty(maxEmpty > 0);

      setGlobalStats({
        mostDrawsPredicted: { users: usersMostDrawsPred, count: maxDrawsPred },
        kingOfDraws: { users: usersKingOfDraws, count: maxDrawsCorr },
        mostExactScores: { users: usersMostExact, count: maxExact },
        mostEmpty: { users: usersMostEmpty, count: maxEmpty }
      });
    }
  }, [submittedData, results]);

  const pct = v => `${(v * 100).toFixed(1)}%`;

  let activeCards = 2;
  if (showKingOfDraws) activeCards++;
  if (showMostEmpty) activeCards++;

  const colSize = Math.floor(12 / activeCards);

  return (
    <Container fluid style={{ background: '#121212', minHeight: '100vh', padding: 20, color: '#fff' }}>
      <Row>
        <Col xs={12}>
          <h2 style={{ textAlign: 'center', color: '#FFD700' }}>
            🏆 Loża Szyderców i Chwały MŚ
          </h2>
        </Col>
      </Row>

      {profiles.map((p, idx) => (
        <div key={idx} style={{ margin: 20, padding: 20, background: '#1e1e1e', borderRadius: 12 }}>
          <h3>👤 {p.user}</h3>
          <div style={{ color: '#FFD700' }}>{p.style}</div>
          <h1>{p.OVR}</h1>

          <div>📊 {pct(p.outcomeRate)} | 🎯 {pct(p.scoreRate)}</div>

          <div>🧠 {p.verdict}</div>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Remisy: {p.drawBetsPredicted}/{p.drawBetsCorrect} | Puste: {p.emptyBets}
          </div>
        </div>
      ))}
    </Container>
  );
};

export default Stats;