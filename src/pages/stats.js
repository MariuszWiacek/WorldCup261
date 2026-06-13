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
      // 🚀 REALISTYCZNY ALGORYTM OVR (A LA EA FC / FIFA)
      // =========================================================
      const baseOVR = 40; 
      const outcomeBonus = outcomeRate * 45; 
      const exactScoreBonus = scoreCorrect * 4.0; 
      
      const OVR = Math.min(Math.round(baseOVR + outcomeBonus + exactScoreBonus), 100);

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 2);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      const mainGoodTeam = bestPointTeams[0] || "losowych reprezentacji";
      const mainBadTeam = worstPointTeams[0] || "murowanych faworytów";

      const drawPredictionRatio = outcomeTotal ? (drawBetsPredicted / outcomeTotal) : 0;

      let style = "";
      let verdict = "";

      // =========================================================
      // 🎭 EKSTREMALNIE ROZBUDOWANA BAZA MUNDIALOWEGO HUMORU
      // =========================================================

      // GRUPA 0: WIDMA I DEZERTERZY (Brak typów na maratonie MŚ)
      const specialGhosts = [
        { s: "Widmo z Trybun", v: `Twoje konto pokryło się kurzem. Oddajesz mecze walkowerem szybciej niż reprezentacje z małych wysp tracą bramki w preeliminacjach. Podobno utknąłeś w strefie kibica albo boisz się presji maratonu 104 meczów.` },
        { s: "Spóźniony Selekcjoner", v: `Analizujesz składy, oglądasz konferencje, ale co z tego, skoro wiecznie zapominasz zatwierdzić kupon przed pierwszym gwizdkiem? Puste pola gonią puste pola. Ustaw budzik na fazę pucharową!` },
        { s: "Ekspert Wakacyjny", v: `Twoja absencja na tym Mundialu staje się legendarna. Rywale dopisują darmowe punkty, a Ty oglądasz turniej z pozycji absolutnego plażowicza. Czy zamierzasz w ogóle wysłać chociaż jeden kupon na ćwierćfinały?` },
        { s: "Kanapowy Dezerter", v: `Cały świat żyje meczami, emocje sięgają zenitu, a u Ciebie w statystykach wieje nudą i pustką. Szkoda uciekających szans, bo z takimi wynikami na turnieju potencjał na punkty był ogromny.` }
      ];

      // GRUPA 1: TOP ELITA MUNDIALOWA (OVR 86 - 100)
      const tierElite_Ofensywny = [
        { s: "Analityczny Terminator MŚ", v: `Coś niesamowitego! Przewidziałeś pogrom faworyta i idealnie wyczułeś intencje selekcjonerów. Bezkompromisowo niszczysz system na tym turnieju, a Twoją osobistą kopalnią punktów stała się ekipa: ${mainGoodTeam}.` },
        { s: "Jasnowidz z Katarskich Pustyń", v: `Zgłoś się do telewizji, bo marnujesz się w amatorskiej lidze. Czytasz przebieg meczów na Mistrzostwach Świata szybciej niż system VAR. Sprawdzamy, czy nie masz bezpośredniego telefonu do Gianniego Infantino!` },
        { s: "Postrach Selekcjonerów", v: `Grasz bezczelnie dobrze. Wybierasz zwycięzców z taką lekkością, jakbyś sam pisał scenariusz tego Mundialu. Rywale dostają stanów lękowych, kiedy zerkają na Twoje zielone kupony.` },
        { s: "Mundialowy Guru", v: `Twoja dominacja na tym turnieju nie podlega dyskusji. Rozpracowałeś specyfikę 104 meczów do perfekcji. Odrzucasz asekuranctwo, grasz na pełne 3 punkty, a reprezentacja, którą jest ${mainGoodTeam}, to Twój złoty talizman.` },
        { s: "Władca Złotego Pucharu", v: `Masz niesamowity zmysł do przewidywania, która nacja zamknie usta krytykom. Omijasz turniejowe miny i sensacje szerokim łukiem. Czysty, profesjonalny i piekielnie skuteczny styl.` }
      ];
      const tierElite_Remisowy = [
        { s: "Chirurg Wyników X", v: `Genialna, wręcz przerażająca intuicja do trafiania remisów tam, gdzie wszyscy stawiali na wielką Brazylię czy Francję. Twoje wyczucie morderczych, mundurowych meczów walki o wyjście z grupy to klasa światowa.` },
        { s: "Cesarz Antyfutbolu", v: `Masz niesamowity zmysł taktyczny. Bezbłędnie polujesz na bezbramkowe remisy w meczach otwarcia i fazie pucharowej. Reprezentacja, którą jest ${mainGoodTeam}, zapewnia Ci spokojny sen i stałe punkty za nudne 0:0.` },
        { s: "Mundialowy Algorytm", v: `Działasz jak dobrze zaprogramowany komputer. Wyłapujesz reprezentacje grające na czas i szukające dogrywek z zimną krwią. Twoja przewaga nad napalonymi na grad bramek graczami rośnie z każdym meczem.` }
      ];

      // GRUPA 2: BARDZO SOLIDNI (OVR 76 - 85)
      const tierSolid_Ofensywny = [
        { s: "Solidny Reprezentant", v: `Bardzo stabilna, wysoka forma na przestrzeni całego maratonu. Stawiasz na konkretnych zwycięzców i rzadko dajesz się nabrać na sensacje. Świetnie czujesz formę, jaką prezentuje ${mainGoodTeam}.` },
        { s: "Łowca Czarnych Koni", v: `Nie robisz szumu, ale co kolejkę bezlitośnie punktujesz na drużynach z Ameryki Południowej czy Afryki. Idealnie wyczuwasz, kiedy faworyt lekceważy rywala. Podium turnieju jest w Twoim zasięgu!` },
        { s: "Mundialowy Strateg", v: `Wiesz doskonale, że turniej ze 104 meczami to morderczy maraton, a nie sprint. Cierpliwie zbierasz punkty na pewniakach, a Twój nos do zwycięstw drużyny ${mainGoodTeam} budzi zasłużony szacunek w tabeli.` },
        { s: "Selekcjoner z Charakterem", v: `Twoje zaangażowanie przynosi świetne efekty. Grasz ofensywnie, unikasz turniejowych pułapek i potrafisz idealnie przewidzieć, która reprezentacja pęknie pod presją milionów kibiców.` }
      ];
      const tierSolid_Remisowy = [
        { s: "Profesor Chłodnej Głowy", v: `Żadnych gwałtownych ruchów na kuponie. Twoja taktyka opiera się na szukaniu podziałów punktów w zaciętych meczach grupowych. Choć czasem ${mainBadTeam} popsuje Ci szyki golem w 94. minucie, remisy trzymają Cię wysoko.` },
        { s: "Władca Dogrywek", v: `Twoja forma jest twardsza niż obrona reprezentacji Włoch w najlepszych latach. Masz niesamowitego nosa do zaciętych meczów o wszystko, gdzie nikt nie chce zaryzykować otwartej gry.` }
      ];

      // GRUPA 3: KLASYCZNA KLASA ŚREDNIA (OVR 66 - 75)
      const tierMedium_Ofensywny = [
        { s: "Ofiara Sensacyjnych Wtop", v: `Doskonale wiesz, kto dominuje na boisku, ale ten turniej to festiwal niespodzianek. Trafiasz faworytów, dopóki Argentyna nie przegra z jakimś autsajderem, niszcząc Twój idealny kupon.` },
        { s: "Romantyk Ofensywnego Futbolu", v: `W głębi serca kochasz piękną grę i w każdym meczu Mundialu typujesz grad bramek i pogromy (3:0, 4:2). Widowisko na ekranie masz super, ale turniejowa pragmatyka i mecze o życie boleśnie weryfikują Twoje punkty.` },
        { s: "Mundialowy Teoretyk", v: `Analizujesz rankingi FIFA, powołania i temperaturę powietrza w miastach gospodarzach. Masz świetną teorię na każdy mecz, tylko szkoda, że piłkarze na murawie kompletnie nie znają Twoich zaawansowanych planów.` },
        { s: "Stabilny Średniak Turnieju", v: `Twoje typy na wygrane potęg są tak bezpieczne, oczywiste i poprawne, że aż nudne. Brakuje Ci odrobiny szaleństwa, żeby postawić na jakąś piękną turniejową sensację i uciec środkowi tabeli.` }
      ];
      const tierMedium_Remisowy = [
        { s: "Koneser Nudnych Meczów", v: `Tam, gdzie inni widzą pewne punkty dla mistrzów świata, Ty uparcie szukasz zapachu nudnego 0:0 lub wymęczonego 1:1. Masz nosa do morderczych meczów walki, choć czasem kosztuje Cię to spadek dynamiki.` },
        { s: "Niezdecydowany Analityk", v: `Szukasz remisów w meczach reprezentacji, które słyną z ultra-ofensywnej gry. Przekombinowujesz przed samym gwizdkiem, próbując przewidzieć sensację tam, gdzie skończy się klasycznym 3:0.` }
      ];

      // GRUPA 4: NIŻSZE SFERY (OVR 51 - 65)
      const tierLow_Ofensywny = [
        { s: "Wizjoner Ślepych Sensacji", v: `Uparcie szukasz wielkich triumfów i historycznych niespodzianek tam, gdzie ich po prostu nie ma. Twój patriotyzm lub sympatia do piłkarskich liliputów jest godna podziwu, ale tabela MŚ bywa bezlitosna.` },
        { s: "Kibic Sukcesu na Zakręcie", v: `Stawiasz w ciemno wyłącznie na wielkie nazwy naczyń (Brazylia, Niemcy, Francja), a te na tym turnieju koncertowo zawodzą i tracą punkty z teoretycznie słabszymi. Lecisz w dół tabeli razem ze swoimi pupilami.` },
        { s: "Mistrz Pechowej Bramki", v: `To jest dopiero dramat. Dobrze przewidujesz, która reprezentacja zgarnie 3 punkty, ale zawsze pomylisz się o tę jedną, kluczową bramkę w doliczonym czasie. Napastnicy robią wszystko, by zepsuć Twoje dokładne wyniki.` },
        { s: "Ofiara Systemu VAR", v: `Masz potwornego pecha na tym turnieju. Twoje dokładne wyniki i wygrane płoną w oczach, gdy sędziowie po pięciominutowej analizie wideo odwołują kluczowe gole ze spalonego o długość paznokcia.` }
      ];
      const tierLow_Remisowy = [
        { s: "Ofiara 90. Minuty", v: `Twoje turniejowe remisy wyglądają doskonale do 89. minuty meczu. Niestety, w doliczonym czasie jakiś rezerwowy zawsze strzela gola życia kolanem po rzucie rożnym, niszcząc Twój podział punktów.` },
        { s: "Pechowy Obrońca Częstochowy", v: `Wkładasz masę pracy w analizę formacji defensywnych, licząc na bezbramkowe remisy w meczach o wyjście z grupy. Los śmieje Ci się w twarz – szybki gol z karnego w 3. minucie niszczy całą Twoją taktykę.` }
      ];

      // GRUPA 5: DÓŁ TABELI (OVR <= 50) - KATASTROFA I SZYDERA MUNDIALOWA
      const tierBottom_Ofensywny = [
        { s: "Podpalacz Mundialowych Kuponów", v: `Grasz z niesamowitą, wręcz ułańską fantazją, stawiając na wygrane reprezentacji, które zapomniały zabrać na turniej butów piłkarskich. Każdy Twój kupon płonie szybciej niż flary kibiców. Czas zmienić taktykę.` },
        { s: "Ślepy Snajper Reprezentacji", v: `Kompletna tragedia na murawie. Nawet jak jakimś cudem wytypujesz zwycięzcę, to liczba bramek ucieka Ci o lata świetlne. Twoim największym katem na tym turnieju jest zdecydowanie reprezentacja: ${mainBadTeam}.` },
        { s: "Generator Losowych Wyników", v: `Kompletny sabotaż kuponów. Wygląda na to, że przed zatwierdzeniem typu dajesz kotu przejść po klawiaturze albo rzucasz rzutkami w mapę świata. Drużyna ${mainBadTeam} regularnie i z premedytacją niszczy Twoje życie.` },
        { s: "Mundialowa Czerwona Latarnia", v: `Zamykasz stawkę mistrzostw. Twoje typy na wygrane potęg są idealnym wskaźnikiem tego, kto w danym meczu zaliczy kompromitację stulecia. Znajomi z ligi powinni stawiać dokładnie odwrotnie niż Ty.` }
      ];
      const tierBottom_Remisowy = [
        { s: "Kolekcjoner Kosmicznych Remisów", v: `Wyniki remisowe, które prognozujesz w meczach absolutnych potęg z totalnymi debiutantami na Mundialu, nie wydarzyłyby się nawet w grach komputerowych. Abstrakcja całkowicie wygrała u Ciebie z logiką.` },
        { s: "Antytalent Taktyczny X", v: `Twoje wyczucie zaciętych meczów turniejowych osiągnęło stan nieważkości. Postawienie przez Ciebie na remis skutkuje natychmiastowym, jednostronnym laniem i pogromem 5:0 na boisku. Niesamowita supermoc.` }
      ];

      // =========================================================
      // SELEKCJA PULI KOMENTARZY (MŚ OVR)
      // =========================================================
      const isRemisowy = drawPredictionRatio > 0.28; 

      let selectedPool = [];

      if (emptyBets > 12) {
        selectedPool = specialGhosts;
      } else if (OVR >= 86) {
        selectedPool = isRemisowy ? tierElite_Remisowy : tierElite_Ofensywny;
      } else if (OVR >= 76) {
        selectedPool = isRemisowy ? tierSolid_Remisowy : tierSolid_Ofensywny;
      } else if (OVR >= 66) {
        selectedPool = isRemisowy ? tierMedium_Remisowy : tierMedium_Ofensywny;
      } else if (OVR >= 51) {
        selectedPool = isRemisowy ? tierLow_Remisowy : tierLow_Ofensywny;
      } else {
        selectedPool = isRemisowy ? tierBottom_Remisowy : tierBottom_Ofensywny;
      }

      // Dynamiczne generowanie unikalnego indeksu, by teksty nie powtarzały się wśród graczy o tym samym progu OVR
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
              * Treści mają charakter wyłącznie humorystyczny i są generowane automatycznie przez sztuczną inteligencję (AI) na podstawie statystyk turniejowych MŚ.
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
              📊 STATYSTYKI GLOBALNE LIGI (MUNDIAL 104 MECZE)
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
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>({p.scoreCorrect} czystych trafień)</div>
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
