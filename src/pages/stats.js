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

// ============================================================================
// 🎭 BANK 53 UNIKALNYCH WERDYKTÓW (KOMENTARZY)
// ============================================================================
const VERDICTS_BANK = {
  zloto: [
    { s: "Geniusz Taktyczny", v: "Absolutny top. Czytasz grę jak otwartą książkę." },
    { s: "Mundialowy Ekspert", v: "Piłkarski jasnowidz. Eksperci telewizyjni powinni brać u Ciebie korepetycje." },
    { s: "Władca Szklanej Kuli", v: "Forma godna mistrza. Rywale widzą Cię już tylko w lusterkach." },
    { s: "Profesor Futbolu", v: "Profesor sztuki typerskiej. Każdy ruch jest przemyślany." },
    { s: "As Wywiadu Sportowego", v: "Geniusz strategii. Twoje analizy i nos do wyników to wyższa szkoła jazdy." },
    { s: "Strateg Nowej Ery", v: "Prawdziwy dominator tego sezonu. Klasa sama w sobie." },
    { s: "Mundialowy Strateg", v: "Złoty standard typowania. Twoja intuicja rzadko kiedy zawodzi." },
    { s: "Analityk Premium", v: "Na tym poziomie nie ma już mowy o przypadku. To czysty skill." },
    { s: "Łowca Wyników", v: "Twoje typy wchodzą z chirurgiczną precyzją. Czapki z głów." },
    { s: "Główny Faworyt Ligi", v: "Gdybyś grał u bukmachera za miliony, właśnie kupowałbyś trzecią wyspę." }
  ],
  srebro: [
    { s: "Solidny Rzemieślnik", v: "Solidna marka w lidze. Trzymasz wysoki poziom." },
    { s: "Czarny Koń Turnieju", v: "Czołówka jest w Twoim zasięgu. Wystarczy kilka dobrych kolejek." },
    { s: "Mundialowy Wojownik", v: "Forma stabilna jak niemiecka defensywa. Bardzo dobry sezon." },
    { s: "Strateg Środka Pola", v: "Widać pomysł i powtarzalność. Masz patent na zbieranie punktów." },
    { s: "Koneser Dobrych Typów", v: "Groźny rywal dla każdego. Nikomu nie odpuszczasz." },
    { s: "Ambitny Ścigający", v: "Typujesz z głową, a wyniki to potwierdzają. Dobra robota." },
    { s: "Analityk z Pasją", v: "Solidny rzemieślnik z ambicjami na mistrza. Trzymaj to tempo." },
    { s: "Mundialowy Aktywista", v: "Większość ligi ogląda Twoje plecy. Masz powoty do zadowolenia." },
    { s: "Ekspert Regionalny", v: "Dobre oko do niespodzianek. Potrafisz urwać punkty w trudnych meczach." },
    { s: "Dżentelmen Tabeli", v: "Forma rośnie w oczach. Za chwilę zapukasz do bram złotej elity." },
    { s: "Oko Skauta", v: "Rzetelna robota z tygodnia na tydzień. Na Tobie można polegać." },
    { s: "Biegiem po Podium", v: "Potrafisz wycisnąć punkty z najgorszych hitów kolejki." },
    { s: "Mundialowy Dyplomata", v: "Bilans zdecydowanie na plus. Sezon w Twoim wykonaniu wygląda obiecująco." }
  ],
  braz: [
    { s: "Ofiara 90. Minuty", v: "Środek tabeli to bezpieczna przystań, ale stać Cię na więcej.", draw: false },
    { s: "Stabilny Urzędnik", v: "Grasz falami – genialne weekendy przeplatasz totalną posuchą.", draw: false },
    { s: "Piłkarski Romantyk", v: "Przeciętny sezon. Potrzebujesz serii punktowej, by uciec szarzyźnie.", draw: false },
    { s: "Typer Falujący", v: "Typujesz sercem, a piłka bywa brutalna. Czas na chłodną kalkulację.", draw: false },
    { s: "Więzień Statystyk", v: "Stabilizacja w środku stawki. Ani grozi Ci spadek, ani walka o złoto.", draw: false },
    { s: "Hamulec Taktyczny", v: "Brakuje kropki nad 'i'. Często jesteś blisko, ale punkty uciekają.", draw: false },
    { s: "Mundialowy Średniak", v: "Podstawy są dobre, ale brakuje odwagi w typowaniu niespodzianek.", draw: false },
    { s: "Ofiara Systemu VAR", v: "Typowy ligowy średniak. Ani nie zachwyca, ani mocno nie rozczarowuje.", draw: false },
    { s: "Mundialowy Turysta", v: "Potencjał jest, ale wykonanie w tym sezonie mocno kratkowane.", draw: false },
    { s: "Ekspert z Kanapy", v: "Czasami brakuje po prostu sportowego szczęścia. Głowa do góry.", draw: false },
    { s: "Zakładnik Sentymentów", v: "Statystyki nie kłamią – ten sezon to solidna, lekka szkoła przetrwania.", draw: false },
    { s: "Koneser Wyniku 1:1", v: "Przynajmniej z remisami masz jakąś nić porozumienia. Uratowały Ci skórę.", draw: true },
    { s: "Strażnik Podziału Punktów", v: "Gdyby nie te trafione remisy, środek tabeli oglądałbyś tylko przez lornetkę.", draw: true }
  ],
  mul: [
    { s: "Dno i metr mułu", v: "Czerwona latarnia ligi. Czas drastycznie zmienić taktykę." },
    { s: "Piłkarski Niewidzialny", v: "Typujesz tak, jakbyś losował wyniki rzutem monetą. I to uszkodzoną." },
    { s: "Anty-Jasnowidz Ligi", v: "Twoja forma szoruje po dnie. Gorzej w tym sezonie być już chyba nie może." },
    { s: "Sponsor Punktów", v: "Czy na pewno oglądasz te same mecze co reszta ligi?" },
    { s: "Generator Losowych Liczb", v: "Twoje typy to gotowy poradnik pt. 'Jak spalić kupon w 5 minut'." },
    { s: "Wstyd i Ubóstwo", v: "Więcej punktów zdobywa się za sam przyjazd na mecz. Katastrofalny bilans." },
    { s: "Maskotka Tabeli", v: "Klasyczny dostarczyciel punktów. Rywale cieszą się na sam widok Twoich typów." },
    { s: "Koszmar Taktyczny", v: "Twoja intuicja ma ewidentnie wolne w tym roku. Czas ją obudzić." },
    { s: "Władca Podziemia", v: "Grasz anty-futbol w wydaniu typerskim. Bolesny widok." },
    { s: "Analfabeta Turniejowy", v: "Nawet najwięksi optymiści tracą wiarę, patrząc na Twoje statystyki." },
    { s: "Taktyczny Sabotażysta", v: "Twoje wyniki wymagają natychmiastowego programu naprawczego." },
    { s: "Kibic Sukcesu Widmo", v: "Gdyby odwrócić tabelę, Twoja dominacja nie podlegałaby dyskusji." }
  ],
  nieaktywny: [
    { s: "Turysta z loży VIP", v: "Turysta z loży VIP. Częściej Cię nie ma, niż jesteś." },
    { s: "VIP bez internetu", v: "Sezon spędzony na trybunach. Walkowery całkowicie zniszczyły Twój dorobek." },
    { s: "Ambasador Walkowerów", v: "Więcej oddanych meczów walkowerem niż realnych typów. Kanapowy kibic." }
  ]
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
        
        // --- NOWY SYSTEM PUNKTACJI (3 PKT ZA WYNIK, 1 PKT ZA TYP) ---
        if (bh === rh && ba === ra) {
          scoreCorrect++;
          calculatedPoints += 3; // Dokładny wynik = 3 punkty
          if (actualOutcome === 'X') drawBetsCorrect++;
          outcomeCorrect++; 
        } else if (String(bet.bet).toUpperCase() === actualOutcome) {
          outcomeCorrect++;
          calculatedPoints += 1; // Tylko tendencja (1X2) = 1 punkt
          if (actualOutcome === 'X') drawBetsCorrect++;
        }
        
        if (String(bet.bet).toUpperCase() === 'X') drawBetsPredicted++;

        let tHome = bet.home || (matchId.includes('_') ? matchId.split('_')[0] : null);
        let tAway = bet.away || (matchId.includes('_') ? matchId.split('_')[1] : null);

        if (!tHome || !tAway) {
          tHome = "Klub H_" + matchId;
          tAway = "Klub A_" + matchId;
        }

        if (!teamStats[tHome]) teamStats[tHome] = { points: 0, cost: 0, total: 0 };
        if (!teamStats[tAway]) teamStats[tAway] = { points: 0, cost: 0, total: 0 };
        teamStats[tHome].total++;
        teamStats[tAway].total++;

        if (String(bet.bet).toUpperCase() === actualOutcome) {
          teamStats[tHome].points++;
          teamStats[tAway].points++;
        } else {
          teamStats[tHome].cost++;
          teamStats[tAway].cost++;
        }
      });

      if (drawBetsCorrect > absoluteMaxDrawsCorrect) absoluteMaxDrawsCorrect = drawBetsCorrect;
      if (scoreCorrect > absoluteMaxExactScores) absoluteMaxExactScores = scoreCorrect;
      if (outcomeCorrect > absoluteMaxOutcomeCorrect) absoluteMaxOutcomeCorrect = outcomeCorrect;

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      const validTeams = Object.entries(teamStats).filter(([name, v]) => v.total >= 1 && !name.startsWith("Klub "));
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      rawProfiles.push({
        user, index, outcomeRate, scoreRate, calculatedPoints,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsPredicted, drawBetsCorrect,
        bestPointTeams, worstPointTeams
      });
    });

    // B. PRZELICZANIE OVR NA BAZIE ROZEGRANYCH SPOTKAŃ I NOWEJ PUNKTACJI
    const output = rawProfiles.map(p => {
      const mainBadTeam = p.worstPointTeams[0] || "pewniaków";

      let OVR = 0;
      if (p.outcomeTotal === 0) {
        OVR = 10;
      } else {
        // Maksymalna teoretyczna liczba punktów do zdobycia w rozegranych meczach (gdyby wszystko trafić za 3 pkt)
        const maxPossiblePoints = p.outcomeTotal * 3;
        const performanceRatio = p.calculatedPoints / maxPossiblePoints;

        // Skalowanie: Złoty poziom (100 OVR) oczekujemy przy zdobyciu ~45% maksymalnych punktów (bardzo wysoki poziom w lidze)
        let baseOvr = (performanceRatio / 0.45) * 100;

        // Kara za pominięte mecze z tych, które już się odbyły
        const missedMatchesInCurrentPool = currentMatchesBase - p.outcomeTotal;
        if (missedMatchesInCurrentPool > 0) {
          baseOvr -= (missedMatchesInCurrentPool * 2.5);
        }

        OVR = Math.max(1, Math.min(Math.round(baseOvr), 99));
      }

      let basket = "braz";
      if (p.emptyBets > 15) {
        basket = "nieaktywny";
      } else if (OVR >= 65) { 
        basket = "zloto";
      } else if (OVR >= 48) { 
        basket = "srebro";
      } else if (OVR >= 30) { 
        basket = "braz";
      } else {
        basket = "mul"; 
      }

      let style = "";
      let verdict = "";
      const seed = p.user.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + p.index;

      // --- AKTYWACJA UNIKALNYCH RÓL PREMIUM DLA LIDERÓW STATYSTYK ---
      if (basket === "nieaktywny") {
        const pool = VERDICTS_BANK.nieaktywny;
        const item = pool[seed % pool.length];
        style = item.s;
        verdict = item.v;
      } 
      // 🎯 Unikalna rola: Snajper Dokładnych Wyników
      else if (p.scoreCorrect === absoluteMaxExactScores && p.scoreCorrect > 0 && OVR >= 48) {
        style = "Chirurg Wyników (Snajper)";
        verdict = `Niewiarygodna precyzja! Masz najwięcej dokładnych trafień w lidze (${p.scoreCorrect}). Podczas gdy inni zgarniają marne grosze za 1X2, Ty inkasujesz potężne pakiety po 3 punkty. Prawdziwy postrach tabeli.`;
      }
      // 🔮 Unikalna rola: Król Czystych Typów 1X2
      else if (p.outcomeCorrect === absoluteMaxOutcomeCorrect && p.outcomeCorrect > 0 && OVR >= 48) {
        style = "Analityk Trendów (Główny Strateg)";
        verdict = `Twoje czytanie boiskowych intencji to majstersztyk. Masz najwięcej bezbłędnie wytypowanych tendencji meczów (${p.outcomeCorrect}). Twój algorytm analityczny rzadko kiedy się myli!`;
      }
      else if (p.drawBetsCorrect === absoluteMaxDrawsCorrect && p.drawBetsCorrect > 0) {
        style = "Oficjalny Król Remisów";
        verdict = `Genialny, turniejowy nos do najbardziej ryzykownych spotkań. Podczas gdy cała liga ślepo stawia na pewniaków, Ty bezbłędnie namierzasz podziały punktów. Oby tak dalej!`;
      } 
      else {
        let currentPool = VERDICTS_BANK[basket];
        if (basket === "braz" && p.drawBetsCorrect === 0) {
          currentPool = currentPool.filter(item => item.draw !== true);
        }
        const item = currentPool[seed % currentPool.length];
        style = item.s;
        verdict = item.v;
      }

      if (p.user.toLowerCase().includes('kuzyn')) {
        style = "Chaotyczny Selekcjoner";
        verdict = `Twoje kupony potrafią zszokować zarówno zaawansowane algorytmy matematyczne, jak i samych zawodników biegających po murawie. Do tego ekipa ${mainBadTeam} regularnie weryfikuje te plany. Absolutna jazda bez trzymanki!`;
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
        <h3>⏳ Wczytywanie i przeliczanie danych ligowych...</h3>
      </Container>
    );
  }

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'sans-serif' }}>
      <Row>
        <Col xs={12}>
          <div style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ color: '#FFD700', margin: 0, fontWeight: 'bold' }}>🏆 Loża Ekspertów i Szyderców MŚ</h2>
            <div style={{ color: '#4caf50', fontSize: '0.75rem', marginTop: '5px', letterSpacing: '0.5px', fontWeight: '500' }}>
              * Ranking OVR uwzględnia wagę punktacji (Dokładny wynik: 3pkt | Typ 1X2: 1pkt).
            </div>
            <hr style={{ borderColor: '#FFD700', width: '30%', margin: '12px auto 10px auto' }} />
          </div>
        </Col>
      </Row>

      {/* GLOBAL REKORDS */}
      <Row className="justify-content-center" style={{ marginBottom: '30px' }}>
        <Col xs={12} md={10} lg={8}>
          <div style={{ background: '#1c1a12', border: '1px solid #FFD700', borderRadius: '14px', padding: '18px', boxShadow: '0 0 15px rgba(255,215,0,0.1)' }}>
            <h5 style={{ color: '#FFD700', margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px', textAlign: 'center' }}>
              📊 MUNDIALOWE REKORDY LIGI
            </h5>
            
            <Row style={{ fontSize: '0.85rem' }}>
              <Col xs={colSize} style={{ marginBottom: '12px', borderRight: '1px solid #2a2a2a' }}>
                <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>🔮 FANATYK REMISÓW</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostDrawsPredicted.users}</div>
                <div style={{ color: '#9e9e9e', fontSize: '0.8rem' }}>{globalStats.mostDrawsPredicted.count} razy postawione "X"</div>
              </Col>

              {showKingOfDraws && (
                <Col xs={colSize} style={{ marginBottom: '12px', borderRight: '1px solid #2a2a2a' }}>
                  <div style={{ color: '#00e5ff', fontSize: '0.7rem', fontWeight: 'bold' }}>👑 OFICJALNY KRÓL REMISÓW</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.kingOfDraws.users}</div>
                  <div style={{ color: '#00e5ff', fontWeight: '600', fontSize: '0.8rem' }}>{globalStats.kingOfDraws.count} trafionych "X"</div>
                </Col>
              )}
              
              <Col xs={colSize} style={{ marginBottom: '12px', borderRight: showMostEmpty ? '1px solid #2a2a2a' : 'none' }}>
                <div style={{ color: '#2196f3', fontSize: '0.7rem', fontWeight: 'bold' }}>🎯 SOKOLE OKO (DOKŁADNE WYNIKI)</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostExactScores.users}</div>
                <div style={{ color: '#2196f3', fontSize: '0.8rem' }}>{globalStats.mostExactScores.count} trafień w dziesiątkę</div>
              </Col>
              
              {showMostEmpty && (
                <Col xs={colSize} style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>💤 ODKLEJONY OD TERMINARZA</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostEmpty.users}</div>
                  <div style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>{globalStats.mostEmpty.count} oddanych walkowerów</div>
                </Col>
              )}
            </Row>
          </div>
        </Col>
      </Row>

      {/* USER CARDS */}
      <Row className="justify-content-center">
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
            } else if (p.style === "Oficjalny Król Remisów") {
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
                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>OVR</span>
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
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>({p.scoreCorrect} trafień za 3pkt)</div>
                    </div>
                  </Col>
                </Row>

                <div style={{ fontSize: '0.9rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                  <div style={{ margin: '6px 0', color: '#ccc' }}>
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>⚡ Zarabiasz na:</span> {p.bestPointTeams.join(', ') || 'Brak danych'}
                  </div>
                  <div style={{ margin: '6px 0', color: '#ccc' }}>
                    <span style={{ color: '#f44336', fontWeight: '600' }}>💔 Tracisz przez:</span> {p.worstPointTeams.join(', ') || 'Brak danych'}
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
                  <span>Remisy (X): {p.drawBetsPredicted} / <strong style={{ color: '#00e5ff' }}>{p.drawBetsCorrect}</strong></span>
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
