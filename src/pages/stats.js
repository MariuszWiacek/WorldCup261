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
  
  const [showKingOfDraws, setShowKingOfDraws] = useState(false);
  const [showMostEmpty, setShowMostEmpty] = useState(false);

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

    Object.keys(submittedData).forEach((user) => {
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
      const OVR = Math.round((outcomeRate * 0.7 + scoreRate * 0.3) * 100);

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 2);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      const mainGoodTeam = bestPointTeams[0] || "losowych drużyn";
      const mainBadTeam = worstPointTeams[0] || " faworytów spotkania";

      // =========================================================
      // 🧠 DYNAMICZNY GENERATOR WERDYKTÓW (ZALEŻNY OD STATYSTYK)
      // =========================================================
      let style = "";
      let verdict = "";

      // 1. SKRAJNE PRZYPADKI (Nieaktywni / Widma)
      if (emptyBets > 15) {
        style = "Mityczna Istota (Widmo)";
        verdict = `Twoje konto pokryło się kurzem. Oddajesz kupony walkowerem szybciej niż reprezentacja San Marino traci bramki. Podobno zjadły Cię obowiązki domowe, albo po prostu boisz się rywalizacji.`;
      } 
      else if (emptyBets > 6) {
        style = "Ekspert Spóźnialski";
        verdict = `Forma i czutka sportowa nawet są, ale co z tego, skoro wiecznie zapominasz wysłać kupon na czas? Gdyby nie te uciekające mecze, reszta ligi mogłaby już zwijać manatki. Ustaw sobie w końcu budzik!`;
      }
      // 2. BARDZO DOBRE TYPY (OVR >= 65) - POZYTYWNE
      else if (OVR >= 70) {
        style = "Analityczny Terminator";
        verdict = `Absolutna demolka w tabeli! Czytasz mecze jak otwartą książkę. Twoja intuicja zawstydza superkomputery. Twoja maszynka do zarabiania działa bezbłędnie, a Twoim największym talizmanem jest ${mainGoodTeam}, na którym kosisz punkty jak profesjonalista.`;
      } 
      else if (OVR >= 60 && scoreRate >= 0.25) {
        style = "Chirurg Dokładnych Wyników";
        verdict = `Genialna intuicja do trafiania w sam punkt! Nie bawisz się w półśrodki – jak już siadasz do typowania, to wjeżdżają czyste, precyzyjne strzały bramkowe. Piłkarze grają dokładnie tak, jak im każesz na kuponie.`;
      }
      else if (OVR >= 58 && drawBetsCorrect >= 4) {
        style = "Cesarz Remisów";
        verdict = `Wyższa szkoła bukmacherskiej magii. Tam, gdzie inni widzą pewne zwycięstwo faworyta, Ty bezbłędnie wyczuwasz zapach nudnego, taktycznego remisu. Masz nosa do morderczych meczów walki, w których nikomu nie chce się biegać.`;
      }
      else if (OVR >= 55) {
        style = "Solidny Ligowiec";
        verdict = `Bardzo stabilna, wysoka forma. Nie schodzisz poniżej pewnego, profesjonalnego poziomu. Świetnie czujesz potencjał jaki ma ${mainGoodTeam} i to na nich budujesz swoją potęgę w tym turnieju. Tak trzymać!`;
      }
      // 3. ŚREDNIE TYPY (OVR 40 - 54) - NEUTRALNE / LEKKO HUMORYSTYCZNE
      else if (OVR >= 48 && scoreRate <= 0.08) {
        style = "Kolekcjoner Minimalizmu";
        verdict = `Doskonale wiesz, kto wygra mecz, ale ustrzelenie dokładnej liczby bramek graniczy u Ciebie z cudem. Punkty kapią powoli, ale sumiennie. Grasz tak bezpiecznie, że na oglądanie meczów pewnie zakładasz kask ochronny.`;
      }
      else if (OVR >= 45 && p => drawBetsPredicted > 8) {
        style = "Wizjoner Ryzyka";
        verdict = `Szukasz sensacji tam, gdzie jej nie ma. Twój upór na stawianie pod prąd jest godny podziwu, ale tabela bywa bezlitosna. Gdyby nie to, jak mocno brutalnie weryfikuje Cię ${mainBadTeam}, byłbyś znacznie wyżej!`;
      }
      else if (OVR >= 42) {
        style = "Kalkulujący Teoretyk";
        verdict = `Analizujesz składy, wilgotność murawy i horoskop sędziego głównego. Masz świetną teorię na każdy mecz, tylko szkoda, że piłkarze biegający po boisku kompletnie nie znają Twoich zaawansowanych planów taktycznych.`;
      }
      else if (OVR >= 40) {
        style = "Romantyk Czystego Show";
        verdict = `W głębi serca kochasz ładny futbol i w każdym meczu typujesz festiwal strzelecki. Wyniki typu 4:3 lub 3:2 to Twój chleb powszedni. Widowisko na ekranie masz świetne, gorzej z punktami w naszej pragmatycznej lidze.`;
      }
      // 4. SŁABSZE TYPY (OVR < 40) - SZYDERA I NEGATYWNE
      else if (OVR < 40 && outcomeRate < 0.38 && scoreRate <= 0.08 && user.toLowerCase().includes('kuzyn')) {
        // ORYGINALNY, NIERUSZANY SPERSONALIZOWANY KUZYN Z PLIKU 1000050629.jpg
        style = "Chaotyczny typer";
        verdict = "Zupełnie nieprzewidywalna forma. Twoje typy potrafią zaskoczyć zarówno algorytm, jak i samych piłkarzy. Potrzebujesz więcej stabilizacji!";
      }
      else if (OVR < 30) {
        style = "Generator Losowości";
        verdict = `Kompletna katastrofa i sabotaż własnego konta. Wygląda na to, że przed zatwierdzeniem kuponu rzucasz monetą, albo dajesz telefon psu do polizania. Ekipa, którą jest ${mainBadTeam}, regularnie spuszcza Twoje nadzieje w toalecie. Czas zmienić taktykę.`;
      }
      else if (OVR < 35 && scoreRate === 0) {
        style = "Ślepy Snajper";
        verdict = `Tragedia w polu karnym! Masz idealne 0% trafionych dokładnych wyników. Nawet jak jakimś cudem trafisz zwycięzcę, napastnicy w 93. minucie zrobią wszystko, żeby zepsuć Twój kupon. Twoim największym wrogiem w tej edycji stała się ekipa: ${mainBadTeam}.`;
      }
      else if (OVR < 38) {
        style = "Ofiara Ostatnich Minut";
        verdict = `Pech ma Twoje imię. Twoje typy wyglądają doskonale do 89. minuty meczu, po czym sędzia dolicza czas, rezerwowy strzela gola życia kolanem i cały Twój misterny plan ląduje w śmietniku. Potrzebujesz egzorcysty, a nie statystyk.`;
      }
      else {
        // Uniwersalny, bezpieczny tył stawki
        style = "Podpalacz Kuponów";
        verdict = `Grasz z niesamowitą fantazją, szkoda tylko, że kompletnie na odwrót niż nakazuje logika. Każdy Twój kupon płonie szybciej niż benzyna. Jeśli chcesz zacząć punktować, sprawdź co obstawiłeś, a potem zmień wszystko na odwrót przed samym meczem.`;
      }

      output.push({
        user, style, verdict, OVR, outcomeRate, scoreRate,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsPredicted, drawBetsCorrect,
        bestPointTeams, worstPointTeams
      });
    });

    // Sortowanie od najlepszego OVR (lidera) do najgorszego
    output.sort((a, b) => b.OVR - a.OVR);
    setProfiles(output);

    // REKALKULACJA LIDERÓW Z FILTRAMI GLOBALNYMI
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
