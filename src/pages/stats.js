import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';

// 🔌 Firebase — serce chaosu typerskiego
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

  const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

  // 📡 LIVE DANE
  useEffect(() => {
    const unsubResults = onValue(ref(db, 'results'), snap =>
      setResults(snap.val() || {})
    );

    const unsubSubmitted = onValue(ref(db, 'submittedData'), snap =>
      setSubmittedData(snap.val() || {})
    );

    return () => {
      unsubResults?.();
      unsubSubmitted?.();
    };
  }, []);

  useEffect(() => {
    if (!submittedData || !results) return;

    const parseScore = (s = "") => {
      const [a, b] = String(s).replace(/\s/g, '').split(':');
      return [Number(a), Number(b)];
    };

    const output = [];

    Object.keys(submittedData).forEach((user) => {
      const bets = submittedData[user] || {};

      let outcomeCorrect = 0;
      let outcomeTotal = 0;
      let scoreCorrect = 0;
      let scoreTotal = 0;
      let emptyBets = 0;
      let drawPred = 0;
      let drawCorr = 0;

      Object.entries(bets).forEach(([matchId, bet]) => {
        const result = results[matchId];
        if (!bet || !result) return;

        if (!bet.score || bet.score === ':::' || bet.score === ':') {
          emptyBets++;
          return;
        }

        const [rh, ra] = parseScore(result);
        const [bh, ba] = parseScore(bet.score);

        const actual = rh === ra ? 'X' : rh > ra ? '1' : '2';

        outcomeTotal++;
        scoreTotal++;

        if (bet.bet === actual) outcomeCorrect++;
        if (bh === rh && ba === ra) scoreCorrect++;

        if (bet.bet === 'X') {
          drawPred++;
          if (actual === 'X') drawCorr++;
        }
      });

      const hasBets = outcomeTotal > 0 || scoreTotal > 0;

      // 👻 brak gry
      if (!hasBets) {
        output.push({
          user,
          OVR: 0,
          style: "Nieaktywny obserwator",
          verdict: "Brak typów = brak miejsca w tabeli.",
          outcomeRate: 0,
          scoreRate: 0,
          outcomeCorrect: 0,
          scoreCorrect: 0,
          outcomeTotal: 0,
          emptyBets,
          drawPred,
          drawCorr
        });
        return;
      }

      // 📊 TABELA (core system)
      const outcomeRate = outcomeCorrect / outcomeTotal;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;
      const activity = Math.min(outcomeTotal / 104, 1);

      const OVRraw =
        outcomeRate * 55 +
        scoreRate * 35 +
        activity * 10;

      const OVR = Math.min(Math.round(OVRraw), 100);

      const seed =
        user.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + OVR;

      // 🎭 WERDYKTY (DUŻA BAZA)

      const ghostPool = [
        "Nieaktywny obserwator ligi.",
        "Brak typów = brak historii.",
        "System nie znalazł Twojej obecności.",
        "Jesteś w tabeli, ale nie grasz.",
        "Offline mode aktywny."
      ];

      const elitePool = [
        "Grasz jak ktoś, kto zna wynik przed meczem.",
        "Tabela jest tylko statystyką Twojej dominacji.",
        "Bukmacherzy analizują Twoje typy jak zagrożenie systemowe.",
        "Twoje decyzje wyprzedzają futbol o krok.",
        "Nie zgadujesz — Ty przewidujesz."
      ];

      const solidPool = [
        "Stabilna forma bez fajerwerków.",
        "Solidny ligowiec — zawsze w grze.",
        "Bez dramatu, bez historii.",
        "Tabela Cię lubi, ale nie kocha.",
        "Grasz poprawnie, ale bez legendy."
      ];

      const midPool = [
        "Środek tabeli — klasyczny balans chaosu.",
        "Raz trafiasz, raz uczysz się na błędach.",
        "Liga zna Twoje imię, ale nie boi się go.",
        "Stabilna przeciętność.",
        "Możesz więcej, ale coś blokuje upgrade."
      ];

      const lowPool = [
        "Tabela nie kłamie — jest ciężko.",
        "Twoje typy testują cierpliwość ligi.",
        "Chaos jest Twoim stylem gry.",
        "Każdy mecz to nowa lekcja bólu.",
        "Futbol wygrywa z Twoją logiką."
      ];

      let style = "";
      let verdict = "";

      if (OVR >= 80) {
        style = "Elita tabeli";
        verdict = pick(elitePool, seed);
      } else if (OVR >= 60) {
        style = "Solidny ligowiec";
        verdict = pick(solidPool, seed);
      } else if (OVR >= 40) {
        style = "Środek tabeli";
        verdict = pick(midPool, seed);
      } else {
        style = "Czerwona latarnia";
        verdict = pick(lowPool, seed);
      }

      output.push({
        user,
        OVR,
        style,
        verdict,
        outcomeRate,
        scoreRate,
        outcomeCorrect,
        scoreCorrect,
        outcomeTotal,
        emptyBets,
        drawPred,
        drawCorr
      });
    });

    output.sort((a, b) => b.OVR - a.OVR);
    setProfiles(output);
  }, [submittedData, results]);

  const pct = v => `${(v * 100).toFixed(1)}%`;

  return (
    <Container fluid style={{ background: '#121212', minHeight: '100vh', color: '#fff', padding: 20 }}>

      <Row>
        <Col xs={12} style={{ textAlign: 'center' }}>
          <h2>🏆 Liga Typerska MŚ</h2>
        </Col>
      </Row>

      {profiles.map((p, i) => (
        <div key={i} style={{ margin: 15, padding: 15, background: '#1e1e1e', borderRadius: 10 }}>

          <h3>👤 {p.user}</h3>
          <div style={{ color: '#FFD700' }}>{p.style}</div>

          <h1>{p.OVR}</h1>

          <div>
            📊 1X2: {pct(p.outcomeRate)} | 🎯 Exact: {pct(p.scoreRate)}
          </div>

          <div style={{ marginTop: 10 }}>
            🧠 {p.verdict}
          </div>

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
            Remisy: {p.drawPred}/{p.drawCorr} | Puste: {p.emptyBets}
          </div>

        </div>
      ))}

    </Container>
  );
};

export default Stats;