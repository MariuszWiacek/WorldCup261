import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';

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
    onValue(ref(db, 'results'), snap => setResults(snap.val() || {}));
    onValue(ref(db, 'submittedData'), snap => setSubmittedData(snap.val() || {}));
  }, []);

  useEffect(() => {
    if (!submittedData || !results) return;

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

      // =========================================================
      // 🚀 NOWA, ZBALANSOWANA SKALA OVR POD TWOJE STATYSTYKI
      // Lider (18 dokładnych, 46 poprawnych) osiągnie teraz około 92-96 OVR.
      // Osoba z 8-10 dokładnymi zakręci się wokół świetnego 75-80 OVR.
      // =========================================================
      const baseOVR = 45; 
      const outcomeBonus = outcomeRate * 35; 
      const exactScoreBonus = scoreCorrect * 2.2; 
      
      const OVR = Math.min(Math.round(baseOVR + outcomeBonus + exactScoreBonus), 100);

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 2);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      const mainGoodTeam = bestPointTeams[0] || "reprezentacji";
      const mainBadTeam = worstPointTeams[0] || "faworytów";

      const drawPredictionRatio = outcomeTotal ? (drawBetsPredicted / outcomeTotal) : 0;

      let style = "";
      let verdict = "";

      // =========================================================
      // 🎭 REALISTYCZNE PROGI I SZYDERA MUNDIALOWA
      // =========================================================

      const specialGhosts = [
        { s: "Dezerter z Copacabany", v: `Twoje konto zrosło się z ławką rezerwowych. Oddajesz mecze walkowerem szybciej niż faworyci tracą bramki w doliczonym czasie. Podobno utknąłeś w strefie kibica bez internetu.` }
      ];

      // KLASA ŚWIATOWA (OVR 86+) - REZERWACJA DLA LIDERÓW LIGI (~14-18 dokładnych wyników)
      const tierElite_Ofensywny = [
        { s: "Mundialowy Szaman", v: `Kosmiczny poziom! Trafić tyle dokładnych wyników przy tylu niespodziankach to czysty układ z sędziami albo szamanizm. Rozpracowałeś ten turniej, a ${mainGoodTeam} to Twój prywatny dostawca punktów premium.` },
        { s: "Analityczny Potwór FIFA", v: `Ty nie typujesz, Ty piszesz scenariusz tego turnieju. Masz więcej trafionych dokładnych wyników niż niektóre reprezentacje mają strzałów na bramkę. Czapki z głów, absolutna elita.` }
      ];
      const tierElite_Remisowy = [
        { s: "Profesor Wyników X", v: `Chora intuicja do nudnych meczów walki o wyjście z grupy. Podczas gdy wszyscy liczyli na pogromy ze strony gigantów, Ty z zimną krwią inkasujesz punkty za bezbramkowe remisy.` }
      ];

      // GENIALNY TYPER / GWIAZDA LIGI (OVR 75 - 85) - (~8-13 dokładnych wyników) -> TU JESTEŚ DOBRY!
      const tierSolid_Ofensywny = [
        { s: "Czarny Koń Typera", v: `OVR 75+ na tym turnieju to rewelacja! Masz na koncie masę bezbłędnie trafionych dokładnych wyników. Nie straszne Ci wpadki potęg, bo idealnie czytasz intencje trenerów. Szczególnie, gdy gra ${mainGoodTeam}.` },
        { s: "Postrach Bukmacherów", v: `Grasz kapitalny turniej. Masz świetne oko do detali – Twoja liczba trafionych wyników w punkt budzi uzasadnioną zazdrość w całej tabeli. Podium jest na wyciągnięcie ręki!` },
        { s: "Mundialowy Strateg", v: `Bardzo wysoka kultura typowania. Wyłapujesz mecze, gdzie faworyt dostaje zadyszki i przekuwasz to na potężne punkty. Zespół ${mainGoodTeam} powinien odpalić Ci procent z premii meczowej.` }
      ];
      const tierSolid_Remisowy = [
        { s: "Minister Obrony Narodowej", v: `Twoja wysoka pozycja i OVR to zasługa kapitalnego wyczucia taktycznego. Wychwytujesz mecze, w których reprezentacje murują bramkę i dowożą cenne remisy do końca.` }
      ];

      // SOLIDNA KLASA ŚREDNIA (OVR 66 - 74) - (~5-7 dokładnych wyników)
      const tierMedium_Ofensywny = [
        { s: "Ofiara Mundurowych Wtop", v: `Grasz dobrze, ale turniejowe niespodzianki (typu wygrana Kopciuszka z pretendentem do złota) regularnie psują Twój wysoki dorobek. Skuteczność 1X2 jest na miejscu, ale brakuje jeszcze kilku czystych trafień bramkowych.` },
        { s: "Niezły Taktyk", v: `Trzymasz się blisko czołówki. Masz przebłyski geniuszu i kilka pięknych wyników w punkt, ale w tym maratonie 104 meczów zdarzają Ci się też kolejki, o których wolałbyś jak najszybciej zapomnieć.` }
      ];
      const tierMedium_Remisowy = [
        { s: "Koneser Wyniku 1:1", v: `Stabilny środek stawki. Masz nosa do zaciętych spotkań, ale zbyt często asekurujesz się remisem tam, gdzie któraś nacja ostatecznie przepycha kolanem wygraną w 90. minucie.` }
      ];

      // NIŻSZE REJONY (OVR 51 - 65) - (Mało dokładnych wyników, faworyci zawodzą)
      const tierLow_Ofensywny = [
        { s: "Ofiara Systemu VAR", v: `Masz potwornego pecha. Często dobrze typujesz zwycięzcę, ale sędziowie anulujący bramki w doliczonym czasie gry zabierają Ci bezcenne punkty za dokładne wyniki. Tabela bywa brutalna.` },
        { s: "Romantyk Pięknego Futbolu", v: `Uparcie wierzysz, że na Mundialu każda potęga wygra 3:0 lub 4:1. Piłkarze jednak wolą nudne, turniejowe 1:0 i przez to tracisz masę punktów na swoich szalonych prognozach.` }
      ];
      const tierLow_Remisowy = [
        { s: "Pechowy Obrońca", v: `Szukasz remisów tam, gdzie padają pogromy. Twoje kalkulacje obronne pękają jak domek z kart, gdy jedna z drużyn strzeli szybkiego gola na początku meczu.` }
      ];

      // DÓŁ TABELI (OVR <= 50) - PEŁNA KATASTROFA I SZYDERA
      const tierBottom_Ofensywny = [
        { s: "Mundialowy Sabotażysta", v: `Kompletny brak formy turniejowej. Twoje typy wyglądają tak, jakbyś rzucał monetą, a i tak los robi Ci na złość. Reprezentacja ${mainBadTeam} skutecznie zadbała o Twój spadek na samo dno tabeli.` },
        { s: "Generator Losowości", v: `Zamykasz stawkę mistrzostw. Jeśli ktoś z Twoich znajomych chce zdobyć punkty, wystarczy że zapyta Cię o typ i postawi dokładnie odwrotnie. Katastrofalny nos do wyników.` }
      ];
      const tierBottom_Remisowy = [
        { s: "Wizjoner Kosmicznych X", v: `Stawiasz remisy w meczach, gdzie faworyci robią sobie trening strzelecki i wygrywają po 5:0. Abstrakcja całkowicie wygrała u Ciebie z logiką boiskową.` }
      ];

      // =========================================================
      // SELEKCJA PULI
      // =========================================================
      const isRemisowy = drawPredictionRatio > 0.28; 
      let selectedPool = [];

      if (emptyBets > 15) {
        selectedPool = specialGhosts;
      } else if (OVR >= 86) {
        selectedPool = isRemisowy ? tierElite_Remisowy : tierElite_Ofensywny;
      } else if (OVR >= 75) { // <--- OD TERAZ 75 TO OFICJALNA GWIAZDA LIGI
        selectedPool = isRemisowy ? tierSolid_Remisowy : tierSolid_Ofensywny;
      } else if (OVR >= 66) {
        selectedPool = isRemisowy ? tierMedium_Remisowy : tierMedium_Ofensywny;
      } else if (OVR >= 51) {
        selectedPool = isRemisowy ? tierLow_Remisowy : tierLow_Ofensywny;
      } else {
        selectedPool = isRemisowy ? tierBottom_Remisowy : tierBottom_Ofensywny;
      }

      const seed = user.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
      const variantIndex = seed % selectedPool.length;
      style = selectedPool[variantIndex].s;
      verdict = selectedPool[variantIndex].v;

      if (user.toLowerCase().includes('kuzyn')) {
        style = "Chaotyczny Selekcjoner";
        verdict = "Zupełnie nieprzewidywalna forma turniejowa. Twoje kupony potrafią zszokować zarówno zaawansowane algorytmy matematyczne, jak i samych zawodników na boisku. Potrzebujesz stabilizacji formy!";
      }

      output.push({
        user, style, verdict, OVR, outcomeRate, scoreRate,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsPredicted, drawBetsCorrect,
        bestPointTeams, worstPointTeams
      });
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
        mostDrawsPredicted: { users: usersMostDrawsPred, count: maxDrawsPred },
        kingOfDraws: { users: usersKingOfDraws, count: maxDrawsCorr },
        mostExactScores: { users: usersMostExact, count: maxExact },
        mostEmpty: { users: usersMostEmpty, count: maxEmpty }
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

      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ color: '#FFD700', margin: 0, fontWeight: 'bold' }}>🏆 Zaawansowane Profile Typerów</h2>
            <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '5px', letterSpacing: '0.5px', fontWeight: '500' }}>
              * Skala OVR dostosowana do realiów turnieju (Lider ~18 dokładnych wyników).
            </div>
            <hr style={{ borderColor: '#FFD700', width: '30%', margin: '12px auto 10px auto' }} />
          </div>
        </Col>
      </Row>

      {/* STATYSTYKI GLOBALNE LIGI */}
      <Row className="justify-content-center" style={{ marginBottom: '30px' }}>
        <Col xs={12} md={10} lg={8}>
          <div style={{ background: '#1c1a12', border: '1px solid #FFD700', borderRadius: '14px', padding: '18px', boxShadow: '0 0 15px rgba(255,215,0,0.1)' }}>
            <h5 style={{ color: '#FFD700', margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', textAlign: 'center' }}>
              📊 STATYSTYKI GLOBALNE LIGI (REALISTYCZNA SKALA MŚ)
            </h5>
            
            <Row style={{ fontSize: '0.85rem' }}>
              <Col xs={colSize} style={{ marginBottom: '12px', borderRight: '1px solid #2a2a2a' }}>
                <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>🔮 NAJWIĘCEJ WYTYPOWANYCH REMISÓW</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostDrawsPredicted.users}</div>
                <div style={{ color: '#9e9e9e', fontSize: '0.8rem' }}>{globalStats.mostDrawsPredicted.count} razy postawione "X"</div>
              </Col>

              {showKingOfDraws && (
                <Col xs={colSize} style={{ marginBottom: '12px', borderRight: '1px solid #2a2a2a' }}>
                  <div style={{ color: '#FFD700', fontSize: '0.7rem', fontWeight: 'bold' }}>👑 OFICJALNY KRÓL REMISÓW</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.kingOfDraws.users}</div>
                  <div style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.8rem' }}>{globalStats.kingOfDraws.count} trafionych remisów</div>
                </Col>
              )}
              
              <Col xs={colSize} style={{ marginBottom: '12px', borderRight: showMostEmpty ? '1px solid #2a2a2a' : 'none' }}>
                <div style={{ color: '#2196f3', fontSize: '0.7rem', fontWeight: 'bold' }}>🎯 CZUŁE OKO (DOKŁADNE WYNIKI)</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostExactScores.users}</div>
                <div style={{ color: '#2196f3', fontSize: '0.8rem' }}>{globalStats.mostExactScores.count} razy w punkt</div>
              </Col>
              
              {showMostEmpty && (
                <Col xs={colSize} style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>💤 NAJWIĘKSZY ZAPOMINALSKI</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostEmpty.users}</div>
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
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>({p.scoreCorrect} trafień w punkt)</div>
                  </div>
                </Col>
              </Row>

              <div style={{ fontSize: '0.9rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                <div style={{ margin: '6px 0', color: '#ccc' }}>
                  <span style={{ color: '#4caf50', fontWeight: '600' }}>⚽ Zarabiasz na:</span> {p.bestPointTeams.join(', ') || 'Brak danych'}
                </div>
                <div style={{ margin: '6px 0', color: '#ccc' }}>
                  <span style={{ color: '#f44336', fontWeight: '600' }}>💔 Tracisz przez:</span> {p.worstPointTeams.join(', ') || 'Brak danych'}
                </div>
              </div>

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
