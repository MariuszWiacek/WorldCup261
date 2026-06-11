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

      // =========================================================
      // 🧠 DYNAMICZNY SYSTEM 50 UNIKALNYCH WERDYKTÓW (PODZIAŁ NA POZIOMY)
      // =========================================================
      let style = "";
      let verdict = "";

      const specialGhosts = [
        { s: "Mityczna Istota (Widmo)", v: `Twoje konto pokryło się metrową warstwą kurzu. Oddajesz kupony walkowerem szybciej niż San Marino traci bramki. Podobno zjadły Cię obowiązki, albo po prostu boisz się porażki.` },
        { s: "Ekspert Spóźnialski", v: `Forma może i gdzieś tam w głowie jest, ale co z tego, skoro wiecznie zapominasz wysłać kupon na czas? Puste typy gonią puste typy. Ustaw sobie w końcu budzik!` },
        { s: "Mistrz Walkowerów", v: `Twoja absencja w tej edycji staje się legendarna. Rywale dopisują darmowe punkty, a Ty oglądasz mecze z pozycji absolutnego obserwatora. Wrócisz jeszcze do gry?` },
        { s: "Kanapowy Dezerter", v: `Wszyscy typują, emocje sięgają zenitu, a u Ciebie w statystykach wieje nudą i pustymi polami. Szkoda uciekających szans, bo potencjał na punkty na pewno był.` },
        { s: "Kibic Widmo", v: `Podobno zapisałeś się do ligi, podobno lubisz piłkę. Statystyki pokazują jednak, że częściej Cię nie ma niż jesteś. Turniej ucieka, a punkty stoją w miejscu.` }
      ];

      const tierElite = [
        { s: "Analityczny Terminator", v: `Absolutna demolka w tabeli! Czytasz mecze jak otwartą książkę. Twoja maszynka do zarabiania działa bezbłędnie, a Twoim największym talizmanem jest ${mainGoodTeam}, na którym kosisz punkty jak profesjonalista.` },
        { s: "Jasnowidz na Etacie", v: `Zgłoś się do jakiejś telewizji, bo marnujesz się w amatorskiej lidze. Czytasz intencje zawodników szybciej niż ich trenerzy. Sprawdzamy Twój telefon pod kątem układów z sędziami!` },
        { s: "Chirurg Wyników", v: `Genialna intuicja do trafiania w sam punkt. Nie bawisz się w półśrodki – wjeżdżają czyste, precyzyjne strzały bramkowe. Piłkarze grają dokładnie tak, jak im każesz na kuponie.` },
        { s: "Cesarz Intuicji", v: `Klasa światowa. Masz niesamowity zmysł taktyczny, a ekipa którą jest ${mainGoodTeam} zapewnia Ci spokojny sen i stały dopływ punktów do tabeli. Reszta stawki patrzy na Ciebie z zazdrością.` },
        { s: "Postrach Bukmacherów", v: `Grasz bezczelnie dobrze. Twoje typy są tak celne, że lokalne punkty przyjmowania zakładów zamykają rolety na Twój widok. Twoje kalkulacje niszczą system.` },
        { s: "Piłkarski Guru", v: `Twoja dominacja nie podlega dyskusji. Analiza meczów w Twoim wykonaniu to czysta poezja. Rozpracowałeś turniej na czynniki pierwsze, a ${mainGoodTeam} to Twoja osobista kopalnia złota.` },
        { s: "Władca Zielonych Kuponów", v: `Zielono mi! Twój profil mieni się od trafionych wyników. Masz niesamowity dar przewidywania zwrotów akcji. Czysty profesjonalizm w każdym calu.` },
        { s: "Futbolowy Algorytm", v: `Działasz jak dobrze zaprogramowany komputer. Zero emocji, czysta kalkulacja i bezlitosne punktowanie rywali. Twoja przewaga rośnie z każdą kolejką.` },
        { s: "Łowca Punktów", v: `Bezwzględny i skuteczny. Wywąchasz punkt w najmniej oczekiwanym meczu. Świetna forma, która budzi uzasadniony strach u reszty uczestników ligi.` }
      ];

      const tierSolid = [
        { s: "Solidny Ligowiec", v: `Bardzo stabilna, wysoka forma. Nie schodzisz poniżej pewnego, profesjonalnego poziomu. Świetnie czujesz potencjał jaki ma ${mainGoodTeam} i to na nich budujesz swoją potęgę.` },
        { s: "Cichy Snajper", v: `Nie krzyczysz na czacie, nie robisz szumu, ale co kolejkę bezlitośnie dopisujesz kolejne punkty. Klasyczny czarny koń, który kontroluje sytuację z bezpiecznej pozycji.` },
        { s: "Profesor Chłodnej Głowy", v: `Żadnych gwałtownych ruchów. Twoja taktyka opiera się na czystej matematyce. Grasz mądrze i chociaż czasami ${mainBadTeam} popsuje Ci szyki, to i tak trzymasz się blisko czołówki.` },
        { s: "Strateg Turniejowy", v: `Wiesz, że turniej to maraton, a nie sprint. Cierpliwie zbierasz punkty i idealnie dawkujesz ryzyko. Twój nos do wyników 1X2 budzi zasłużony szacunek.` },
        { s: "Władca Stabilizacji", v: `Twoja forma jest twardsza niż beton. Rzadko zaliczasz spektakularne wpadki, dzięki czemu systematycznie pnącz się w górę. Dobra, rzemieślnicza robota.` },
        { s: "Ekspert z Kanapy", v: `Twoje typy mają ręce i nogi. Widać, że oglądasz mecze i dobrze analizujesz sytuację. Gdyby tylko ${mainBadTeam} przestało grać na przekór Twoim kuponom, byłoby idealnie.` },
        { s: "Kalkulator Formy", v: `Masz bardzo dobry przegląd pola. Potrafisz precyzyjnie ocenić, kto jest w gazie. Regularne punktowanie to Twoja domena, a podium jest na wyciągnięcie ręki.` },
        { s: "Taktyczny Wyjadacz", v: `Twoje zaangażowanie przynosi świetne efekty. Unikasz głupich błędów i potrafisz wyciągać wnioski z poprzednich meczów. Bardzo groźny zawodnik.` },
        { s: "Pewny Gracz", v: `Rzadko zawodzisz. Twoje typy to synonim solidności. Nawet kiedy faworyci zawodzą, Ty potrafisz znaleźć bezpieczną przystań i uratować cenne punkty.` }
      ];

      const tierMedium = [
        { s: "Kolekcjoner Minimalizmu", v: `Doskonale wiesz, kto wygra mecz, ale ustrzelenie dokładnej liczby bramek graniczy u Ciebie z cudem. Punkty kapią powoli, ale sumiennie. Bezpieczeństwo przede wszystkim!` },
        { s: "Romantyk Czystego Show", v: `W głębi serca kochasz ładny futbol i w każdym meczu typujesz festiwal strzelecki. Widowisko na ekranie masz świetne, gorzej z punktami w naszej pragmatycznej lidze.` },
        { s: "Wielki Teoretyk", v: `Analizujesz składy, wilgotność murawy i horoskop sędziego. Masz świetną teorię na każdy mecz, tylko szkoda, że piłkarze biegający po boisku kompletnie nie znają Twoich planów.` },
        { s: "Cesarz Remisowy", v: `Tam, gdzie inni widzą pewne punkty, Ty bezbłędnie wyczuwasz zapach nudnego 0:0. Masz nosa do morderczych meczów walki, w których nikomu nie chce się biegać.` },
        { s: "Niezdecydowany Gracz", v: `Przekombinowujesz przed samym gwizdkiem. Twoja primera intuicja zazwyczaj jest dobra, ale potem zaczynasz poprawiać i sam siebie wpuszczasz w maliny.` },
        { s: "Średniowieczny Wojownik", v: `Grasz twardo, ale bez większego planu. Raz spektakularny sukces, raz bolesna porażka. Trzymasz się bezpiecznego środka tabeli, ale stać Cię na więcej.` },
        { s: "Typowy Średniak", v: `Ni ziębi, ni grzeje. Twoje typy są tak poprawne, że aż nudne. Brakuje Ci odrobiny szaleństwa i zaryzykowania na nieszablonowe rozstrzygnięcia.` },
        { s: "Poszukiwacz Formy", v: `Miotasz się od ściany do ściany. Jedna kolejka genialna, następna do zapomnienia. Jeśli ustabilizujesz formę, środek tabeli szybko zamienisz na europejskie puchary.` },
        { s: "Analityk z TikToka", v: `Twoje typy wyglądają na oparte o 15-sekundowe skróty z internetu. Dużo dymu, efektowne strzały, ale brakuje chłodnej głowy i spojrzenia w tabelę ligową.` }
      ];

      const tierLow = [
        { s: "Wizjoner Ryzyka", v: `Szukasz sensacji tam, gdzie jej nie ma. Twój upór na stawianie pod prąd jest godny podziwu, ale tabela bywa bezlitosna. Musisz zacząć grać znacznie bezpieczniej.` },
        { s: "Ofiara Ostatnich Minut", v: `Pech ma Twoje imię. Twoje typy wyglądają doskonale do 89. minuty meczu, po czym rezerwowy strzela gola życia kolanem i cały Twój misterny plan ląduje w śmietniku.` },
        { s: "Farfocel League", v: `Twoje punkty to często czysty przypadek. Sam nie wiesz, czemu postawiłeś taki wynik, ale rykoszet w końcówce ratuje honor kuponu. Kompletny brak logiki, ale grunt, że coś wpada.` },
        { s: "Kibic Sukcesu na Zakręcie", v: `Stawiasz tylko na potęgi, a te w tym turnieju koncertowo zawodzą. Kiedy Real lub City tracą punkty, Ty tracisz z nimi grunt pod nogami. Czas zacząć doceniać słabszych.` },
        { s: "Wieczny Optymista", v: `U Ciebie w każdym meczu musi padać grad bramek. Typujesz kosmiczne wyniki, bo pragniesz show. Widowisko dostajesz na ekranie, punkty w tabeli – rzadko.` },
        { s: "Pechowy Analityk", v: `Wkładasz mnóstwo pracy w analizę, ale los śmieje Ci się w twarz. Zespół, który miał dominować, dostaje czerwoną kartkę w 5. minucie i niszczy Twoje starania. Głowa do góry!` },
        { s: "Krytyk Algorytmów", v: `Twoje typy nie pasują do żadnych modeli matematycznych ani statystyk. Grasz absolutnie pod prąd i udowadniasz, że ludzka nieprzewidywalność nie zna granic.` },
        { s: "Sabotażysta Własnego Konta", v: `Masz niesamowity talent do zmieniania zdania na 5 minut przed meczem. Gdybyś zostawiał pierwszą intuicję, byłbyś wyżej. Zamiast tego przekombinowujesz.` },
        { s: "Mistrz Jednej Bramki", v: `Przewidujesz zwycięzcę, ale zawsze pomylisz się o tę jedną, kluczową bramkę. Albo zabraknie rzutu karnego, albo napastnik potknie się o własne nogi przed pustą bramką.` }
      ];

      const tierBottom = [
        { s: "Podpalacz Kuponów", v: `Grasz z niesamowitą fantazją, szkoda tylko, że kompletnie na odwrót niż nakazuje logika. Każdy Twój kupon płonie szybciej niż benzyna. Czas zmienić doradców.` },
        { s: "Ślepy Snajper", v: `Tragedia w polu karnym. Nawet jak jakimś cudem trafisz zwycięzcę, to dokładny wynik ucieka Ci o lata świetlne. Twoim największym katem w tej edycji jest zdecydowanie ${mainBadTeam}.` },
        { s: "Generator Losowości", v: `Kompletny sabotaż. Wygląda na to, że przed zatwierdzeniem kuponu rzucasz monetą albo dajesz telefon psu do polizania. Ekipa ${mainBadTeam} regularnie niszczy Twoje nadzieje.` },
        { s: "Czerwona Latarnia", v: `Zamykasz stawkę i bezpiecznie pilnujesz dna tabeli. Twoje typy są idealnym wskaźnikiem tego, co w meczu się NIE WYDARZY. Jeśli ktoś chce wygrać, powinien stawiać odwrotnie niż Ty.` },
        { s: "Dyrektor Destrukcji", v: `Twoje konto punktowe płacze rzewnymi łzami. Nie pomaga analiza, nie pomaga intuicja. ${mainBadTeam} bezlitośnie wbija gwóźdź do trumny Twoich turniejowych ambicji.` },
        { s: "Bukmacherski Antytalent", v: `Twoje wyczucie sportowe osiągnęło stan nieważkości. Postawienie na faworyta skutkuje jego natychmiastową porażką. Posiadasz niesamowitą supermoc niszczenia pewniaków.` },
        { s: "Kolekcjoner Poronionych Pomysłów", v: `Wyniki, które prognozujesz, nie wydarzyłyby się nawet w grach komputerowych. Szaleństwo wygrało z logiką, a tabela brutalnie podsumowuje te eksperymenty.` },
        { s: "Dno i Metr Mułu", v: `Forma spadła poniżej poziomu morza. Przegrywasz rywalizację nawet z osobami, które zapominają wysyłać kupony. Czas na natychmiastowy reset taktyczny.` },
        { s: "Dostawca Darmowych Punktów", v: `Twoja obecność w lidze niezwykle cieszy rywali, którzy bez wysiłku uciekają Ci w zestawieniu. Ekipa ${mainBadTeam} skutecznie dba o to, żebyś nie podniósł się z kolan.` }
      ];

      let selectedPool = tierMedium;
      if (emptyBets > 8) {
        selectedPool = specialGhosts;
      } else if (OVR >= 65) {
        selectedPool = tierElite;
      } else if (OVR >= 55) {
        selectedPool = tierSolid;
      } else if (OVR >= 46) {
        selectedPool = tierMedium;
      } else if (OVR >= 36) {
        selectedPool = tierLow;
      } else {
        selectedPool = tierBottom;
      }

      const variantIndex = index % selectedPool.length;
      style = selectedPool[variantIndex].s;
      verdict = selectedPool[variantIndex].v;

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
      
      // 1. Najwięcej wytypowanych remisów
      const maxDrawsPred = Math.max(...output.map(p => p.drawBetsPredicted));
      const usersMostDrawsPred = output.filter(p => p.drawBetsPredicted === maxDrawsPred).map(p => p.user).join(', ');

      // 2. Król Remisów (Trafione remisy)
      const maxDrawsCorr = Math.max(...output.map(p => p.drawBetsCorrect));
      const usersKingOfDraws = output.filter(p => p.drawBetsCorrect === maxDrawsCorr).map(p => p.user).join(', ');
      setShowKingOfDraws(maxDrawsCorr > 0);

      // 3. Czujne oko (Dokładne wyniki) -> POKAZUJE WSZYSTKICH JEŚLI REMIS W STATYSTYKACH
      const maxExact = Math.max(...output.map(p => p.scoreCorrect));
      const usersMostExact = output.filter(p => p.scoreCorrect === maxExact).map(p => p.user).join(', ');

      // 4. Największy zapominalski
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
                {/* Tutaj wyświetlają się wszyscy ze stałym, najwyższym wynikiem */}
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.mostExactScores.users}</div>
                <div style={{ color: '#2196f3', fontSize: '0.8rem' }}>{globalStats.mostExactScores.count} razy w punkt</div>
              </Col>
              
              {showMostEmpty && (
                <Col xs={colSize} style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold' }}>💤 NAJWIĘKSZY ZAPOMINALSKI (:::)</div>
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
