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
      const OVR = Math.round((outcomeRate * 0.7 + scoreRate * 0.3) * 100);

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 2);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      const mainGoodTeam = bestPointTeams[0] || "losowych drużyn";
      const mainBadTeam = worstPointTeams[0] || "faworytów spotkania";

      // Proporcja typowanych remisów do wszystkich typów (żeby sprawdzić styl)
      const drawPredictionRatio = outcomeTotal ? (drawBetsPredicted / outcomeTotal) : 0;

      // =========================================================
      // 🧠 LOGIKA DYNAMICZNYCH POZIOMÓW I STYLÓW GRY (50 WERDYKTÓW)
      // =========================================================
      let style = "";
      let verdict = "";

      // GRUPA 0: ZAPOMINALSCY (Nadrzędna nad formą)
      const specialGhosts = [
        { s: "Mityczna Istota (Widmo)", v: `Twoje konto pokryło się metrową warstwą kurzu. Oddajesz kupony walkowerem szybciej niż San Marino traci bramki. Podobno zjadły Cię obowiązki, albo po prostu boisz się porażki.` },
        { s: "Ekspert Spóźnialski", v: `Forma może i gdzieś tam w głowie jest, ale co z tego, skoro wiecznie zapominasz wysłać kupon na czas? Puste typy gonią puste typy. Ustaw sobie w końcu budzik!` },
        { s: "Mistrz Walkowerów", v: `Twoja absencja w tej edycji staje się legendarna. Rywale dopisują darmowe punkty, a Ty oglądasz mecze z pozycji absolutnego obserwatora. Wrócisz jeszcze do gry?` },
        { s: "Kanapowy Dezerter", v: `Wszyscy typują, emocje sięgają zenitu, a u Ciebie w statystykach wieje nudą i pustymi polami. Szkoda uciekających szans, bo potencjał na punkty na pewno był.` },
        { s: "Kibic Widmo", v: `Podobno zapisałeś się do ligi, podobno lubisz piłkę. Statystyki pokazują jednak, że częściej Cię nie ma niż jesteś. Turniej ucieka, a punkty stoją w miejscu.` }
      ];

      // GRUPA 1: ELITA (OVR >= 65) - TOP FORMA
      const tierElite_Ofensywny = [
        { s: "Analityczny Terminator", v: `Absolutna demolka w tabeli! Unikasz asekuracyjnych remisów, bezkompromisowo stawiasz na czyste wygrane i kosisz punkty jak profesjonalista. Twoim największym talizmanem jest ${mainGoodTeam}.` },
        { s: "Jasnowidz na Etacie", v: `Zgłoś się do jakiejś telewizji, bo marnujesz się w amatorskiej lidze. Czytasz intencje zwycięzców szybciej niż ich trenerzy. Sprawdzamy Twój telefon pod kątem układów z sędziami!` },
        { s: "Postrach Bukmacherów", v: `Grasz bezczelnie dobrze i agresywnie. Wybierasz zdecydowanych zwycięzców, a Twoje precyzyjne kalkulacje niszczą system i doprowadzają rywali do łez.` },
        { s: "Piłkarski Guru", v: `Twoja dominacja nie podlega dyskusji. Rozpracowałeś turniej na czynniki pierwsze. Odrzucasz remisy, grasz o pełną pulę, a drużyna ${mainGoodTeam} to Twoja osobista kopalnia złota.` },
        { s: "Władca Zielonych Kuponów", v: `Twój profil mieni się od trafionych czystych wyników. Masz niesamowity dar przewidywania, kto zmiażdży rywala. Czysty, bezkompromisowy profesjonalizm.` }
      ];
      const tierElite_Remisowy = [
        { s: "Chirurg Wyników X", v: `Genialna intuicja do trafiania w sam punkt tam, gdzie nikt się tego nie spodziewa. Twoje wyczucie remisów i trudnych meczów walki to absolutna klasa światowa.` },
        { s: "Cesarz Intuicji", v: `Masz niesamowity zmysł taktyczny. Bezbłędnie polujesz na podziały punktów, a ekipa którą jest ${mainGoodTeam} zapewnia Ci spokojny sen i stałą przewagę w tabeli.` },
        { s: "Futbolowy Algorytm", v: `Działasz jak dobrze zaprogramowany komputer. Wyłapujesz remisowe tendencje z zimną krwią, a Twoja przewaga nad osobami grającymi tylko na faworytów rośnie z każdą kolejką.` },
        { s: "Łowca Cennych Punktów", v: `Bezwzględny i skuteczny. Wywąchasz remis w najmniej oczekiwanym meczu. Świetna forma, która budzi uzasadniony strach i podziw u reszty uczestników ligi.` }
      ];

      // GRUPA 2: SOLIDNI (OVR 55 - 64) - DOBRA FORMA
      const tierSolid_Ofensywny = [
        { s: "Solidny Ligowiec", v: `Very stabilna, wysoka forma. Stawiasz na konkretne rozstrzygnięcia, unikasz asekuranctwa. Świetnie czujesz potencjał jaki ma ${mainGoodTeam} i to na nich budujesz swoją potęgę.` },
        { s: "Cichy Snajper 1X2", v: `Nie robisz szumu na czacie, ale co kolejkę bezlitośnie trafiasz zwycięzców spotkań. Klasyczny czarny koń, który kontroluje sytuację stawiając na pełne trzy punkty.` },
        { s: "Strateg Turniejowy", v: `Wiesz, że turniej to maraton. Cierpliwie wybierasz ekipy, które zgarną zwycięstwa i idealnie dawkujesz ryzyko. Twój nos do wygranych dla ${mainGoodTeam} budzi zasłużony szacunek.` },
        { s: "Taktyczny Wyjadacz", v: `Twoje zaangażowanie przynosi świetne efekty. Grasz ofensywnie, unikasz głupich błędów i potrafisz wyciągać wnioski, celnie wskazując kto zdominuje murawę.` },
        { s: "Pewny Gracz", v: `Rzadko zawodzisz przy typowaniu faworytów. Twoje typy to synonim solidności. Nawet kiedy inni kombinują z remisami, Ty potrafisz znaleźć bezpieczną wygraną i zgarnąć punkty.` }
      ];
      const tierSolid_Remisowy = [
        { s: "Profesor Chłodnej Głowy", v: `Żadnych gwałtownych ruchów. Twoja taktyka opiera się na szukaniu podziałów punktów. Grasz mądrze i chociaż czasami ${mainBadTeam} popsuje Ci szyki, to remisy trzymają Cię wysoko.` },
        { s: "Władca Stabilizacji", v: `Twoja forma jest twardsza niż beton. Masz nosa do zaciętych, zamkniętych meczów. Rzadko zaliczasz wpadki, bo równe, remisowe wyniki dają Ci systematyczny awans.` },
        { s: "Ekspert z Remisowej Kanapy", v: `Widać, że dobrze analizujesz taktykę defensywną zespołów. Gdyby tylko ${mainBadTeam} przestało strzelać zwycięskie gole w 90. minucie na przekór Twoim 'X', byłoby idealnie.` },
        { s: "Kalkulator Podziałów", v: `Masz bardzo dobry przegląd pola. Potrafisz precyzyjnie ocenić, kiedy drużyny zadowolą się jednym punktem. Regularne trafianie trudnych meczów to Twoja domena.` }
      ];

      // GRUPA 3: ŚREDNIAKI (OVR 46 - 54) - ŚRODEK TABELI
      const tierMedium_Ofensywny = [
        { s: "Kolekcjoner Minimalizmu", v: `Doskonale wiesz, kto wygra mecz, ale ustrzelenie dokładnej liczby bramek graniczy u Ciebie z cudem. Typujesz zwycięstwa, ale punkty za dokładny wynik uciekają.` },
        { s: "Romantyk Czystego Show", v: `W głębi serca kochasz ładny futbol i w każdym meczu typujesz wysokie wygrane faworytów. Widowisko na ekranie masz świetne, gorzej z punktami w naszej pragmatycznej lidze.` },
        { s: "Wielki Teoretyk Wygranych", v: `Analizujesz składy i historię kontuzji. Masz świetną teorię na zwycięstwo danej drużyny, tylko szkoda, że piłkarze biegający po boisku kompletnie nie znają Twoich planów.` },
        { s: "Typowy Średniak", v: `Ni ziębi, ni grzeje. Twoje typy na wygrane są tak oczywiste i poprawne, że aż nudne. Brakuje Ci odrobiny szaleństwa i zaryzykowania na nieszablonowe rozstrzygnięcia.` },
        { s: "Poszukiwacz Zwycięstw", v: `Miotasz się od ściany do ściany. Jedna kolejka z pięknymi wygranymi, następna do zapomnienia. Jeśli ${mainBadTeam} przestanie Cię zawodzić, środek tabeli szybko zamienisz na podium.` }
      ];
      const tierMedium_Remisowy = [
        { s: "Cesarz Remisowy", v: `Tam, gdzie inni widzą pewne punkty dla potęg, Ty uparcie szukasz zapachu nudnego 0:0 lub 1:1. Masz nosa do morderczych meczów walki, choć czasem kosztuje Cię to spadek dynamiki.` },
        { s: "Niezdecydowany Strateg", v: `Szukasz złotego środka i remisów tam, gdzie powinna pójść czysta deklaracja wygranej. Przekombinowujesz przed samym gwizdkiem i sam siebie wpuszczasz w maliny.` },
        { s: "Średniowieczny Wojownik", v: `Grasz twardo, często asekurując się podziałem punktów. Raz spektakularny sukces w nudnym meczu, raz bolesna porażka. Trzymasz się bezpiecznego środka tabeli.` },
        { s: "Analityk Zamkniętych Meczów", v: `Twoje typy wyglądają na oparte na defensywnych statystykach. Dużo uwagi poświęcasz obronie, przez co brakuje Ci punktów z meczów, gdzie pada grad bramek.` }
      ];

      // GRUPA 4: SŁABSI (OVR 36 - 45) - DOŁY ŚRODKA
      const tierLow_Ofensywny = [
        { s: "Wizjoner Ślepych Wygranych", v: `Szukasz wielkich triumfów i sensacyjnych wygranych tam, gdzie ich nie ma. Twój upór na stawianie na słabsze zespoły jest godny podziwu, ale tabela bywa bezlitosna.` },
        { s: "Kibic Sukcesu na Zakręcie", v: `Stawiasz tylko na wygrane potęg (Real, City, Bayern), a te w tym turnieju koncertowo zawodzą. Kiedy wielcy tracą punkty, Ty lecisz w dół tabeli razem z nimi.` },
        { s: "Wieczny Optymista Bramkowy", v: `U Ciebie w każdym meczu ktoś musi wysoko wygrać (3:2, 4:1). Typujesz kosmiczne scenariusze, bo pragniesz show. Widowisko dostajesz na ekranie, punkty w tabeli – rzadko.` },
        { s: "Sabotażysta Własnego Kuponu", v: `Masz talent do zmieniania typu na wygraną na 5 minut przed meczem. Gdybyś zostawiał pierwszą intuicję i nie kombinował z bramkami, byłbyś znacznie wyżej.` },
        { s: "Mistrz Nietrafionej Bramki", v: `Dobrze przewidujesz, kto zgarnie 3 punkty, ale zawsze pomylisz się o tę jedną, kluczową bramkę w wyniku. Napastnicy robią wszystko, żeby zepsuć Twój kupon.` }
      ];
      const tierLow_Remisowy = [
        { s: "Ofiara Ostatnich Minut", v: `Twoje remisy wyglądają doskonale do 89. minuty meczu. Niestety, w doliczonym czasie ktoś zawsze strzela gola życia kolanem, niszcząc Twój podział punktów i sens życia.` },
        { s: "Farfocel Draw League", v: `Twoje punkty za remisy to często czysty przypadek. Sam nie wiesz, czemu postawiłeś akurat tam "X", ale rykoszet w końcówce ratuje honor kuponu. Kompletny brak logiki.` },
        { s: "Pechowy Strateg Defensywy", v: `Wkładasz pracę w analizę obrony, licząc na bezbramkowe remisy. Niestety, los śmieje Ci się w twarz – szybki gol w 2. minucie niszczy całe Twoje starania.` },
        { s: "Krytyk Logiki Boiskowej", v: `Uparcie forsujesz remisy w meczach, gdzie obie ekipy grają ultra-ofensywnie. Grasz pod prąd matematyce i udowadniasz, że intuicja czasem wyprowadza na manowce.` }
      ];

      // GRUPA 5: DÓŁ TABELI (OVR < 36) - SZYDERA
      const tierBottom_Ofensywny = [
        { s: "Podpalacz Kuponów", v: `Grasz z niesamowitą fantazją, stawiając na wygrane drużyn, które zapomniały jak się biega. Każdy Twój kupon płonie szybciej niż benzyna. Czas zmienić doradców.` },
        { s: "Ślepy Snajper Wygranych", v: `Tragedia w polu karnym. Nawet jak jakimś cudem trafisz zwycięzcę, to bramki uciekają Ci o lata świetlne. Twoim największym katem w tej edycji jest zdecydowanie ${mainBadTeam}.` },
        { s: "Generator Losowości", v: `Kompletny sabotaż. Wygląda na to, że przed zatwierdzeniem wygranej rzucasz monetą albo dajesz telefon psu do polizania. Ekipa ${mainBadTeam} regularnie niszczy Twoje kupony.` },
        { s: "Czerwona Latarnia", v: `Zamykasz stawkę. Twoje typy na zwycięzców są idealnym wskaźnikiem tego, kto w meczu NA PEWNO przegra. Jeśli ktoś chce zdobyć punkty, powinien stawiać odwrotnie niż Ty.` },
        { s: "Dostawca Darmowych Punktów", v: `Twoje ślepe stawianie na wygrane faworytów bez analizy formy niezwykle cieszy rywali. Ekipa ${mainBadTeam} skutecznie dba o to, żebyś nie podniósł się z kolan.` }
      ];
      const tierBottom_Remisowy = [
        { s: "Kolekcjoner Poronionych Remisów", v: `Wyniki remisowe, które prognozujesz w meczach liderów z autsajderami, nie wydarzyłyby się nawet w grach komputerowych. Szaleństwo wygrało z logiką.` },
        { s: "Dno i Metr Mułu", v: `Forma spadła poniżej poziomu morza. Twoje uporczywe szukanie remisów skutkuje tym, że przegrywasz rywalizację nawet z osobami, które zapominają wysyłać kupony.` },
        { s: "Dyrektor Remisowej Destrukcji", v: `Twoje konto punktowe płacze rzewnymi łzami. Próbujesz na siłę asekurować się remisami, a ${mainBadTeam} bezlitośnie wbija gwóźdź do trumny Twoich ambicji.` },
        { s: "Bukmacherski Antytalent X", v: `Twoje wyczucie zaciętych meczów osiągnęło stan nieważkości. Postawienie na remis skutkuje natychmiastowym jednostronnym laniem na boisku. Niesamowita supermoc.` }
      ];

      // =========================================================
      // SELEKCJA PULI NA PODSTAWIE STATYSTYK I STYLU TYPOWANIA
      // =========================================================
      
      const isRemisowy = drawPredictionRatio > 0.28; // Jeśli ponad 28% typów to remisy -> styl remisowy

      let selectedPool = [];

      if (emptyBets > 8) {
        selectedPool = specialGhosts;
      } else if (OVR >= 65) {
        selectedPool = isRemisowy ? tierElite_Remisowy : tierElite_Ofensywny;
      } else if (OVR >= 55) {
        selectedPool = isRemisowy ? tierSolid_Remisowy : tierSolid_Ofensywny;
      } else if (OVR >= 46) {
        selectedPool = isRemisowy ? tierMedium_Remisowy : tierMedium_Ofensywny;
      } else if (OVR >= 36) {
        selectedPool = isRemisowy ? tierLow_Remisowy : tierLow_Ofensywny;
      } else {
        selectedPool = isRemisowy ? tierBottom_Remisowy : tierBottom_Ofensywny;
      }

      // Bezpieczne pobranie wariantu (brak błędu przekroczenia tablicy)
      const variantIndex = index % selectedPool.length;
      style = selectedPool[variantIndex].s;
      verdict = selectedPool[variantIndex].v;

      // 🚨 SPECJALNY WARUNEK: KUZYN (Z pliku 1000050629.jpg)
      if (user.toLowerCase().includes('kuzyn')) {
        style = "Chaotyczny typer";
        verdict = "Zupełnie nieprzewidywalna forma. Twoje typy potrafią zaskoczyć zarówno algorytm, jak i samych piłkarzy. Potrzebujesz więcej stabilizacji!";
      }

      output.push({
        user, style, verdict, OVR, outcomeRate, scoreRate,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsPredicted, drawBetsCorrect,
        bestPointTeams, worstPointTeams
      });
    });

    output.sort((a, b) => b.OVR - a.OVR);
    setProfiles(output);

    // =========================================================
    // 🎯 LOGIKA GROMADZENIA WSPÓŁLIDERÓW W KAFELKACH GLOBALNYCH
    // =========================================================
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
                  <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>💤 NAJWIĘKSZY ZAPOMINALSKI (:::)</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostEmpty.users}</div>
                  <div style={{ color: '#f44336', fontSize: '0.8rem' }}>{globalStats.emptyBets} pustych typów</div>
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
                  <span style={{ color: '#4caf50', fontWeight: '600' }}>⚽ Zarabiasz na:</span> {p.bestPointTeams.join(', ') || 'Brak stabilnych danych'}
                </div>
                <div style={{ margin: '6px 0', color: '#ccc' }}>
                  <span style={{ color: '#f44336', fontWeight: '600' }}>💔 Tracisz przez:</span> {p.worstPointTeams.join(', ') || 'Brak stabilnych danych'}
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
