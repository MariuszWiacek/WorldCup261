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

    // Mapujemy użytkowników i przypisujemy im całkowicie unikalne role z puli 23 pozycji
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
      // 🎭 PEŁNA LISTA 23 CAŁKOWICIE UNIKALNYCH OPISÓW I WERDYKTÓW
      // =========================================================
      const allUniqueVariants = [
        {
          s: "Jasnowidz na Etacie",
          v: "Zgłoś się do jakiejś telewizji, bo marnujesz się w naszej amatorskiej lidze. Czytasz intencje zawodników szybciej niż ich własni trenerzy. Podejrzanie często trafiasz – sprawdzamy Twój telefon pod kątem układów z sędziami."
        },
        {
          s: "Kalkulujący Profesor",
          v: "Nuda, stabilizacja i zero szaleństwa. Grasz jak stary, doświadczony ligowiec, który zamiast widowiska woli brzydkie, bezpieczne punkty. Bukmacherzy płaczą, kiedy składasz kupon."
        },
        {
          s: "Chirurg Wyników",
          v: "Rzadko trafiasz ogólny rezultat, ale jak już w coś bębniesz, to z dokładnością do milimetra! Polujesz wyłącznie na skomplikowane wyniki. Prawdziwy snajper bezlitosnej precyzji."
        },
        {
          s: "Cesarz Remisowy",
          v: "Gdzie inni widzą pewne trzy punkty dla faworyta, Ty bezbłędnie wyczuwasz zapach nudnego 0:0 na odległość kilometra. Masz nosa do morderczych meczów walki, w których nikt nie chce biegać."
        },
        {
          s: "Chaotyczny typer", // KLASYK Z PLIKU 1000050629.jpg ZAWSZE W PULI
          v: "Zupełnie nieprzewidywalna forma. Twoje typy potrafią zaskoczyć zarówno algorytm, jak i samych piłkarzy. Potrzebujesz więcej stabilizacji!"
        },
        {
          s: "Kolekcjoner Minimalizmu",
          v: "Wiesz kto wygra, ale ustrzelenie dokładnego wyniku bramkowego graniczy u Ciebie z cudem. Grasz tak bezpiecznie, że nawet na wakacje jedziesz w kasku. Punkty kapią powoli, ale sumiennie."
        },
        {
          s: "Szalony Wizjoner",
          v: "Kompletny paradoks. Potrafisz koncertowo wyłożyć się na murowanym faworycie, żeby godzinę później bez mrugnięcia okiem trafić kosmiczny, łamany wynik meczu skazywanych na pożarcie underdogów."
        },
        {
          s: "Ofiara Ostatnich Minut",
          v: "Fatum w czystej postaci. Twoje kupony wyglądają idealnie do 89. minuty, po czym jakiś rezerwowy strzela gola życia, niszcząc Twój dokładny wynik i sens życia. Potrzebujesz egzorcysty."
        },
        {
          s: "Romantyk Futbolu",
          v: "Zawsze typujesz sercem, a nie rozumem. Wierzysz w piękne powroty, słabsze drużyny i sportowe bajki. Twoje kupony są piękne, szkoda tylko, że brutalna rzeczywistość weryfikuje je tuż po pierwszym gwizdku."
        },
        {
          s: "Wielki Teoretyk",
          v: "Znasz składy, analizujesz wilgotność murawy i historię kontuzji kuzyna lewego obrońcy. Masz teorię na każdy mecz. Szkoda tylko, że piłkarze na boisku kompletnie nie wiedzą o Twoich zaawansowanych planach."
        },
        {
          s: "Farfocel League",
          v: "Twoje punkty to czysty przypadek. Sam nie wiesz, czemu postawiłeś taki wynik, ale rykoszet w 94. minucie uznaje Twoją genialną niewiedzę. Kompletny brak logiki, ale grunt, że wpada!"
        },
        {
          s: "Kibic Sukcesu",
          v: "Stawiasz tylko na potęgi. Real, City, Bayern – dla Ciebie mniejsi gracze mogliby nie istnieć. Kiedy wielcy wygrywają, Ty świętujesz. Kiedy przychodzi faza pucharowa i sensacje, zaczynają się Twoje schody."
        },
        {
          s: "Betonowy Defensywny",
          v: "Dla Ciebie mecz bez bezbramkowego remisu to mecz stracony. Kochasz wyniki 1:0 i 0:0. Uważasz, że formacje ofensywne istnieją tylko po to, żeby psuć ludziom dobrze przemyślane kupony."
        },
        {
          s: "Nocny Analityk",
          v: "Kupony zatwierdzasz o 3:40 nad ranem po przewertowaniu południowoamerykańskich forów dyskusyjnych. Twoja determinacja zasługuje na medal, chociaż Twoje zmęczone oczy czasami mylą drużyny."
        },
        {
          s: "Sabotażysta Własnego Portfela",
          v: "Masz niesamowity talent do zmieniania zdania na 5 minut przed meczem. Gdybyś zostawiał swoje pierwsze, intuicyjne typy, byłbyś na podium. Zamiast tego przekombinowujesz sam siebie."
        },
        {
          s: "Mistrz Jednej Bramki",
          v: "Przewidujesz zwycięzcę i przebieg meczu, ale zawsze pomylisz się o jedną bramkę. Albo zabraknie rzutu karnego, albo napastnik potknie się o własne nogi przed pustą bramką. Klątwa trwa."
        },
        {
          s: "Krytyk Algorytmów",
          v: "Twoje typy nie pasują do żadnych modeli matematycznych ani statystyk. Grasz absolutnie pod prąd i podświadomie udowadniasz komputerom, że ludzka nieprzewidywalność wciąż rządzi tym światem."
        },
        {
          s: "Wieczny Optymista",
          v: "U Ciebie w każdym meczu musi padać grad bramek. Typujesz wyniki typu 4:3 lub 5:2, bo w głębi duszy pragniesz czystego show. Widowisko dostajesz, punkty w tabeli – rzadziej."
        },
        {
          s: "Cichy Ciułacz",
          v: "Nikt na Ciebie nie zwraca uwagi, nie udzielasz się na czacie, ale co kolejke po cichu dopisujesz kolejne małe punkty. Klasyczny czarny koń, który zaatakuje z cienia w najważniejszym momencie turnieju."
        },
        {
          s: "Analityk z TikToka",
          v: "Twoje typy wyglądają tak, jakbyś opierał je na 15-sekundowych skrótach z internetu i fryzurach napastników. Dużo dymu, widowiskowe strzały, ale brakuje w tym wszystkim chłodnej, taktycznej głowy."
        },
        {
          s: "Główny Hamulcowy",
          v: "Kiedy cała liga stawia na jednego, pewnego faworyta, Ty jako jedyny ryzykujesz i dajesz na remis lub przegraną. Zazwyczaj płoniesz razem z kuponem, ale ten jeden raz, kiedy trafisz, będziesz wspominać latami."
        },
        {
          s: "Ekspert Dezerter",
          v: "Wiedza ekspercka jest, intuicja też, tylko co z tego, skoro budzik na wysyłanie kuponów dzwoni u Ciebie trzy godziny po meczu? Gdyby nie te uciekające walkowery, reszta tabeli trzęsłaby portkami."
        },
        {
          s: "Mityczna Istota",
          v: "Twoje konto w tabeli pokryło się już metrową warstwą kurzu. Więcej meczów oddajesz walkowerem niż realnie typujesz. Podobno ktoś Cię kiedyś widział na trybunach, ale to niepotwierdzone plotki."
        }
      ];

      // Bezpieczny przydział indeksu (od 0 do 22) gwarantujący brak powtórzeń w 23-osobowej lidze
      const poolIndex = index % 23;
      let style = allUniqueVariants[poolIndex].s;
      let verdict = allUniqueVariants[poolIndex].v;

      // Inteligentne nadpisanie ról dla skrajnych, ewidentnych przypadków
      if (emptyBets > 15) {
        style = "Mityczna Istota";
        verdict = "Twoje konto w tabeli pokryło się już metrową warstwą kurzu. Więcej meczów oddajesz walkowerem niż realnie typujesz.";
      } else if (outcomeTotal > 0 && outcomeRate < 0.35 && scoreRate <= 0.05) {
        style = "Chaotyczny typer";
        verdict = "Zupełnie nieprzewidywalna forma. Twoje typy potrafią zaskoczyć zarówno algorytm, jak i samych piłkarzy. Potrzebujesz więcej stabilizacji!";
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
