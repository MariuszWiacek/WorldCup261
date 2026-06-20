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

// WYPAKOWANY BANK WERDYKTÓW (PO 15+ NA GRUPĘ)
const VERDICTS_BANK = {
  zloto: [
    { s: "Jasnowidz na etacie", v: "Typujesz z taką precyzją, że zaraz zgłosi się do Ciebie ABW z podejrzeniem o podróże w czasie." },
    { s: "Piłkarski Matrix", v: "Zagiąłeś system. Ty nie przewidujesz wyników, Ty je po prostu programujesz przed meczem." },
    { s: "Ekspert z Bożej Łaski", v: "Twoje OVR świeci tak mocno, że reszta ligi musi oglądać tabelę w okularach przeciwsłonecznych." },
    { s: "Władca Szklanej Kuli", v: "Bukmacherzy płaczą, kiedy otwierasz aplikację. Absolutna dominacja i brak litości." },
    { s: "Profesor z Harvardu", v: "Twoje analizy są tak zaawansowane, że chłopy na kanapie myślą, że masz układ z sędziami VAR." },
    { s: "Bóg Typerki", v: "Gdybyś rzucił pracę i zajął się tylko tym, zakłady bukmacherskie ogłosiłyby upadłość w trzy dni." },
    { s: "Architekt Wyników", v: "Twoja intuicja nie pyta, czy można. Ona wchodzi na salony razem z drzwiami i bierze wszystko." },
    { s: "Naczelny Strateg", v: "Przejrzałeś taktykę wszystkich trenerów na turnieju. Nawet Guardiola dzwoni pytać, co postawić." },
    { s: "Dziecko Przeznaczenia", v: "Gwiazdy ułożyły się w idealną sygnaturę Twoich typów. Absolutny kosmos punktowy." },
    { s: "Złoty Nos", v: "Wyczuwasz gole zanim zawodnicy wyjdą z szatni na rozgrzewkę. Niebywały instynkt łowcy." },
    { s: "Algorytm Nostradamusa", v: "Twoje konto powinno być zablokowane za oszukiwanie rzeczywistości. Bezbłędne czytanie gry." },
    { s: "Generał Zwycięstwa", v: "Dowodzisz swoimi typami z precyzją Napoleona. Każdy mecz to dla Ciebie formalność i punkty." },
    { s: "Piłkarny Iluzjonista", v: "Sprawiasz, że najtrudniejsze wyniki wyglądają na banalne. Rywale po prostu przecierają oczy." },
    { s: "Główny Reżyser", v: "Scenariusze meczowe chyba piszesz sam przed weekendem. Niemożliwy poziom wyczucia." },
    { s: "Szachista Zielonej Murawy", v: "Widzisz trzy ruchy do przodu, podczas gdy reszta ligi wciąż zastanawia się, kto gra w obronie." }
  ],
  srebro: [
    { s: "Prawie Jak Szpakowski", v: "Wiesz, że dzwoni, wiesz, w którym kościele, ale czasem zamiast trójki wpada tylko skromny punkcik." },
    { s: "Czarny Koń z Plastiku", v: "Niby groźny, niby w czołówce, ale jak przyjdzie co do czego, to remisujesz z logiką." },
    { s: "Ministrant Statystyk", v: "Grasz bezpiecznie jak defensywny pomocnik z Ekstraklasy. Szału nie ma, ale punkty kapią." },
    { s: "Wielka Nadzieja Białych", v: "Masz przebłyski geniuszu, ale przeplatasz je typami, o których wolałbyś szybko zapomnieć przy piwie." },
    { s: "Koneser Średniej Hawajskiej", v: "Solidne rzemiosło. Nie jest to włoska pizza, ale da się zjeść i nie zepsuć humoru." },
    { s: "Książę Solidności", v: "Nie porywasz tłumów, ale metodycznie zbierasz to, co los rzuci na stół. Stabilny pretendent do pudła." },
    { s: "Cichy Zabójca", v: "Nikt na Ciebie nie stawia na głos, a Ty po cichu, bez fleszy, podgryzasz liderów od zaplecza." },
    { s: "Taktyczny Średniak", v: "Twoja forma faluje jak Bałtyk w listopadzie. Jeden dzień jak profesor, drugi jak stażysta." },
    { s: "O krok od Chwały", v: "Do pełni szczęścia brakuje Ci tak niewiele, że aż boli. Jeden gol w końcówce dzieli Cię od elity." },
    { s: "Główny Inspektor", v: "Analizujesz, liczysz, kalkulujesz. Masz wiedzę, ale czasem brakuje Ci odrobiny szaleństwa." },
    { s: "Prezes Zarządu Efektywności", v: "Robisz minimum tego, co trzeba, żeby być wysoko. Bez popisów, czysta matematyczna kalkulacja." },
    { s: "Dżentelmen z Klasą", v: "Trzymasz fason i nie schodzisz poniżej pewnego poziomu. Solidna, europejska marka typera." },
    { s: "Łowca Okazji", v: "Budzisz się w najważniejszych meczach. Gdy stawka rośnie, Twoje typy nagle zaczynają trafiać." },
    { s: "Kolekcjoner Srebra", v: "Masz wszystko, by wygrać, prócz tego ostatniego błysku szczęścia. Ale podium jest blisko." },
    { s: "Cień Lidera", v: "Ktokolwiek jest pierwszy, czuje Twój oddech na plecach. Czekasz na jeden potknięty krok." }
  ],
  braz: [
    { s: "Ofiara 93. minuty", v: "Twoim największym wrogiem są doliczone minuty. Gdyby mecze trwały 80 minut, byłbyś bogaty." },
    { s: "Stabilny Urzędnik", v: "Emocji w Twoich typach tyle, co przy rozliczaniu PIT-u. Niby wszystko się zgadza, ale radości z tego brak." },
    { s: "Piłkarski Romantyk", v: "Stawiasz sercem, a potem rzeczywistość weryfikuje Cię brutalnie jak poniedziałkowy budzik." },
    { s: "Hamulec Taktyczny", v: "Twoja intuicja chyba została na lotnisku. Kręcisz się wokół zera jak elektron wokół jądra." },
    { s: "Więzień Przeciętności", v: "Ani nie spadniesz na dno, ani nie powąchasz pudła. Taki ligowy dżentelmen bez wyrazu." },
    { s: "Mistrz Przetrwania", v: "Twoja taktyka to rozpaczliwa obrona Częstochowy. Ledwo dychasz, ale wciąż utrzymujesz się nad kreską." },
    { s: "Czołg bez Paliwa", v: "Miały być wielkie wyniki i marsz po puchar, a skończyło się na rzężeniu silnika w środku stawki." },
    { s: "Janusz Typerki", v: "Typujesz przy grillu, rzucając okiem na skróty meczów. Wyniki są... dokładnie takie, jak metoda." },
    { s: "Kolekcjoner Jedynek", v: "Zbierasz te pojedyncze punkciki z takim mozołem, jakby to były kupony rabatowe do marketu." },
    { s: "Wieczny Optymista", v: "Wierzysz w piękną piłkę i czyste intencje. Szkoda tylko, że brutalny świat weryfikuje to co drugi wieczór." },
    { s: "Koneser Dogrywek", v: "Zawsze liczysz na cud tam, gdzie go nie ma. Żyjesz nadziejami, punkty zdobywasz od święta." },
    { s: "Brat Łata Tabeli", v: "Wszyscy Cię lubią, nikomu nie zagrażasz. Idealny środek stawki bez żadnych ambicji." },
    { s: "Zagubiony w Analizie", v: "Przeczytasz sto artykułów przed meczem, a na koniec i tak zaznaczysz zły wynik. Przeanalizowany pech." },
    { s: "Ofiara VAR-u", v: "Twoje punkty ulatują z dymem za każdym razem, gdy sędzia podchodzi do monitora. Fatum." },
    { s: "Minimalista Roku", v: "Cieszysz się z jednego punktu, jakbyś wygrał całą ligę. Ambicje dopasowane do możliwości." }
  ],
  mul: [
    { s: "Dno i metr mułu", v: "Oficjalnie szorujesz po dnie. Gdyby odwrócić tabelę do góry nogami, Twoja dominacja byłaby bezdyskusyjna." },
    { s: "Generator Losowych Liczb", v: "Twoje typy wyglądają tak, jakby kot przeszedł się po klawiaturze numerycznej. Pełen chaos." },
    { s: "Sponsor Oficjalny", v: "Rywale powinni zrzucić się dla Ciebie na pizzę w podzięce za to, jak skutecznie windujesz ich w górę tabeli." },
    { s: "Anty-Jasnowidz", v: "Gdy stawiasz na drużynę A, bezpieczniej jest postawić dom, oszczędności życia i nerkę na drużynę B." },
    { s: "Koszmar Typera", v: "Twoja forma jest stabilna – stabilnie zła. Nawet sędziowie z B-klasy mieliby lepszą skuteczność." },
    { s: "Maskotka Ligi", v: "Nikt się Ciebie nie boi, ale wszyscy Cię lubią, bo tak pięknie zamykassan tabelę od dołu." },
    { s: "Sabotażysta Roku", v: "Twoje predykcje wywołują u innych graczy niekontrolowane napady śmiechu. Zmień dyscyplinę na krykiet." },
    { s: "Chaotyczny Selekcjoner", v: "Twoje kupony to czysty surrealizm. Wyglądają jak losowe rzuty rzutkami w tarczę, a mecze skutecznie leczą Cię z resztek optymizmu." },
    { s: "Rozbitek na Mieliźnie", v: "Zgubiłeś kompas, mapę i chyba w ogóle zapomniałeś, jakie zasady panują w tej dyscyplinie sportu." },
    { s: "Czerwona Latarnia", v: "Świecisz tak mocno na dole tabeli, że piloci samolotów omijają Twoje konto szerokim łukiem." },
    { s: "Niewidzialna Ręka Rynku", v: "Twoje typy spektakularnie niszczą jakąkolwiek logikę matematyczną. To wręcz unikalny talent." },
    { s: "VIP bez internetu", v: "Oddałeś walkowery lub zapomniałeś hasła do telefonu. Klasyczny kanapowy duch tego turnieju." },
    { s: "Król Ślepych Trafów", v: "Nawet rzucając monetą, miałbyś statystycznie lepsze wyniki. Twój system to czysta destrukcja." },
    { s: "Królewski Donator", v: "Twoja hojność w oddawaniu punktów za darmo przejdzie do historii tej ligi. Samarytanin." },
    { s: "Kreator Wolnego Czasu", v: "Wygląda na to, że typujesz z zamkniętymi oczami podczas jazdy tramwajem. Zero kontroli." },
    { s: "Piłkarski Ignorant", v: "Czy Ty na pewno wiesz, że w piłce wygrywa ten, kto strzeli więcej goli? Twoje typy sugerują coś innego." }
  ]
};

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

    // Zbiór przydzielonych już tekstów (zapobiega powtórzeniom u userów)
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
      if (p.emptyBets > 15 || OVR < 30) {
        basket = "mul"; // "nieaktywni" i najsłabsi trafiają do wspólnego wora
      } else if (OVR >= 65) { 
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

        // Pętla wyszukująca najbliższy NIEUŻYWANY werdykt w danej grupie
        let attempts = 0;
        while (usedVerdicts.has(item.s) && attempts < currentPool.length) {
          poolIndex = (poolIndex + 1) % currentPool.length;
          item = currentPool[poolIndex];
          attempts++;
        }

        style = item.s;
        verdict = item.v;
        usedVerdicts.add(style);
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
            <h2 style={{ color: '#FFD700', margin: 0, fontWeight: 'bold' }}>🏆 Loża Ekspertów i Szyderców MŚ</h2>
            <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '5px', letterSpacing: '0.5px', fontWeight: '500' }}>
              * Uwaga: System zawiera lokowanie bezwzględnej prawdy i czystej szydery. Przeglądasz na własną odpowiedzialność.
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
                <div style={{ color: '#2196f3', fontSize: '0.8rem' }}>{globalStats.mostExactScores.count} trafień w punkt (3pkt)</div>
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
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>{p.scoreCorrect}</div>
                    </div>
                  </Col>
                </Row>

                <div style={{ fontSize: '0.9rem', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                  <div style={{ margin: '6px 0', color: '#ccc' }}>
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>🟢 Punktują:</span> {p.bestPointTeams.join(', ') || 'Brak danych'}
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
                  <strong>🧠 Werdykt systemu:</strong> {verdict}
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