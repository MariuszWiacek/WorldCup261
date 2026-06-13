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
      // 🚀 NOWY, SPRAWIEDLIWY SYSTEM POCHODZENIA OVR
      // =========================================================
      let OVR = 0;

      // BEZPIECZNIK ABSOLUTNEGO ZERA: Masz 0 trafień? Twój OVR umiera.
      if (outcomeCorrect === 0 && scoreCorrect === 0) {
        OVR = emptyBets > 0 ? Math.max(12 - emptyBets, 0) : 0; 
      } else {
        const baseOVR = 45; 
        const outcomeBonus = outcomeRate * 35; 
        const exactScoreBonus = scoreCorrect * 2.2; 
        OVR = Math.min(Math.round(baseOVR + outcomeBonus + exactScoreBonus), 100);
      }

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 2);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      const mainGoodTeam = bestPointTeams[0] || "reprezentacji";
      const mainBadTeam = worstPointTeams[0] || "faworytów";

      let style = "";
      let verdict = "";

      // =========================================================
      // 🎭 NOWA KOLEKCJA KOMENTARZY (Z UWZGLĘDNIENIEM DNA I MUŁU)
      // =========================================================

      // SPECJALNA SEKRECYJNA GRUPA: DNO I METR MUŁU (OVR < 20 lub 0 trafień) - 10 komentarzy
      const tierAbsoluteZero = [
        { s: "Dno i metr mułu", v: `Oficjalne, certyfikowane dno tej ligi. Nie trafiłeś NIC. Twój bilans punktowy wygląda jak konto bankowe po wakacjach. Gdyby w tej lidze były spadki, spadłbyś nawet z b klasy.` },
        { s: "Piłkarski Niewidzialny", v: `Okrągłe zero trafień. Twoja intuicja sportowa jest tak głęboko w mule, że potrzebujemy ekipy nurków, żeby ją odnaleźć. Nawet rzucając monetą miałbyś fart, a Ty przeszedłeś do historii jako anty-mistrz.` },
        { s: "Legenda Najniższego OVR", v: `Twój wynik to czysta abstrakcja. Jak można obejrzeć tyle meczów i nie trafić ani zwycięzcy, ani wyniku? Ekipa ${mainBadTeam} idealnie podsumowuje Twój poziom patologii taktycznej.` },
        { s: "Sponsor Punktów", v: `Dno osiągnięte, czas zacząć kopać w mule. Jesteś idealnym tłem dla reszty ligi. Twoja obecność tutaj polega głównie na poprawianiu humoru ludziom, którzy mają chociaż 2 punkty.` },
        { s: "Analfabeta Turniejowy", v: `Twoja karta OVR szoruje po dnie z taką siłą, że zaraz pęknie ekran. Twój instynkt do omijania punktów powinien być badany przez instytuty naukowe. Totalna katastrofa.` },
        { s: "Wstyd i Ubóstwo", v: `Nawet nie wiemy jak to skomentować. Masz mniej punktów niż reprezentacje, które odpadły w przedbiegach. Wyłącz to i zacznij zbierać grzyby, tam przynajmniej coś znajdziesz.` },
        { s: "Anty-Jasnowidz", v: `Niewiarygodne! Masz tak potężny talent do błędnych typów, że powinieneś brać pieniądze od ludzi za mówienie im, co obstawiasz, żeby mogli postawić na odwrót. Jesteś zerem (dosłownie).` },
        { s: "Maskotka Tabeli", v: `Siedzisz na samym dole, przykryty warstwą mułu i wodorostów. Twoje OVR to oficjalny powód do memów na grupowej konwersacji. Gratulacje, gorzej się fizycznie nie dało.` },
        { s: "Koszmar Piłkarstwa", v: `Twoje typy obrażają dyscyplinę sportową, jaką jest piłka nożna. Nawet ślepy traf by coś ugrał, a Ty uparcie trzymasz stabilne zero. Absolutna kompromitacja taktyczna.` },
        { s: "Władca Podziemia", v: `Osiągnąłeś stan absolutnego zera bezwzględnego. Zamknąłeś tabelę z kłódką, a klucz wrzuciłeś do rzeki. Reszta ligi dziękuje za tak łatwego rywala.` }
      ];

      // KOSZYK 1: ELITA TURNIEJU (OVR >= 85) - 10 komentarzy
      const tierElite = [
        { s: "Bezczelny Jasnowidz", v: `Obrzydliwie wysoka forma. Trafiasz dokładne wyniki z taką łatwością, jakbyś opłacał bramkarzy. Wyłącz ten komputer z NASA i daj żyć reszcie ligi. Ekipa ${mainGoodTeam} sponsoruje Twoje wakacje.` },
        { s: "Mundialowy Cyborg", v: `To nie jest normalne. Kiedy cały świat płacze, bo potęgi koncertowo wtapiają mecze, Ty siedzisz z założonymi rękami i zgarniasz komplet punktów. Jesteś bezdusznym potworem statystyk.` },
        { s: "Władca Szklanej Kuli", v: `Przejrzałeś ten turniej zanim piłkarze spakowali walizki. Twoje typy to czysta poezja, a reszta tabeli może najwyżej wyczyścić Ci buty. Absolutna, bezwzględna dominacja.` },
        { s: "Główny Architekt Sukcesu", v: `Twoja przewaga w tabeli budzi uzasadnioną nienawiść. Pachnie to jakimś przeciekiem z szatni albo potężnym układem z sędziami VAR. Strach się z Tobą zakładać o cokolwiek.` },
        { s: "Profesor Futbolu Premium", v: `Grasz w zupełnie innej lidze. Liczba Twoich trafień w dziesiątkę przeraża bukmacherów. Masz tak potężny monopol na rację, że powinieneś zastąpić całe studio eksperckie w TV.` },
        { s: "Koszmar Analityków", v: `Twoja intuition demoluje algorytmy matematyczne. Widzisz bramki tam, gdzie inni widzą murowanie dostępu do pola karnego. Ty nie zgadujesz wyników, Ty po prostu znasz przyszłość.` },
        { s: "Szef Wszystkich Szefów", v: `Spokój, chłodna kalkulacja i zabójcza skuteczność. Twoja karta OVR świeci się na złoto tak mocno, że oślepia ludzi z dolnej połowy tabeli. Absolutny mistrz tej edycji.` },
        { s: "Strateg Nowej Ery", v: `Gdybyś zarządzał budżetem reprezentacji tak, jak zarządzasz kuponami, mielibyśmy mistrzostwo świata. Twoje oko do detali i bezbłędne rozczytanie ekipy ${mainGoodTeam} przejdzie do historii.` },
        { s: "Mundialowy Terminator", v: `Zero sentymentów, samo gęste. Nie patrzysz na historię i sympatie – bezlitośnie punktujesz wpadki gigantów i precyzyjne inkasujesz punkty za dokładne rezultaty. Klasa światowa.` },
        { s: "Jasnowidz z powołania", v: `Inni gracze mogą już powoli walczyć tylko o drugie miejsce. Twój instynkt łowcy bramek działa bez zarzutu. Przestań udawać zaskoczonego swoimi wynikami, wiemy że to zaplanowałeś.` }
      ];

      // KOSZYK 2: DOSKONAŁY TYPER / GWIAZDA (OVR 75 - 84) - 10 komentarzy
      const tierSolid = [
        { s: "As Wywiadu FIFA", v: `OVR 75+ na tym turnieju to rewelacja! Masz oko snajpera – trafiasz seriami dokładne wyniki tam, gdzie inni zaliczają spektakularne gleby. Zespół ${mainGoodTeam} to Twój prywatny bankomat.` },
        { s: "Pogromca Bukmacherów", v: `Grasz bez kompleksów. Idealnie omijasz miny w fazie grupowej, a Twoje precyzyjne strzały w dokładne wyniki regularnie demolują morale reszty graczy. Podium jest na wyciągnięcie ręki.` },
        { s: "Strateg z Copacabany", v: `Bardzo mocna karta w tej edycji. Masz świetny nos do ofensywnych ekip. Twój system działa bez zarzutu, dopóki ${mainBadTeam} nie zrobi jakiegoś sabotażu w doliczonym czasie gry.` },
        { s: "Turniejowy Drapieżnik", v: `Nie panikujesz, kiedy faworyci zaliczają glebę. Spokojnie kalkulujesz siłę ognia i regularnie zgarniasz grube punkty. Rywale czują Twój gorący oddech na plecach.` },
        { s: "Generał Formacji Ofensywnej", v: `Znakomite wyczucie turniejowego rytmu. Twoja liczba punktów w punkt budzi uzasadnioną zazdrość w środku stawki. Jesteś o krok od zostania legendą tych mistrzostw.` },
        { s: "Elitarny Snajper Wyników", v: `Kiedy stawiasz kupon, czujesz zapach bramek. Masz świetną powtarzalność i potrafisz wyciągnąć maksa z teoretycznie nudnych meczów. Twoja taktyka przynosi genialne efekty.` },
        { s: "Mundialowy Rekin", v: `Pływasz w tej tabeli bardzo pewnie i pożerasz słabszych typerów. Twoje wysokie OVR to nie przypadek, tylko efekt omijania najbardziej oczywistych pułapek zastawionych przez los.` },
        { s: "Doktor Nauk Typerstwa", v: `Wysoka kultura typowania. Wyłapujesz mecze, gdzie faworyt dostaje zadyszki i przekuwasz to na potężny zysk. Drużyna ${mainGoodTeam} powinna odpalić Ci procent ze swoich premii.` },
        { s: "Łowca Czystych Kont", v: `Twoje precyzyjne oko bezbłędnie namierza drużyny, które potrafią zamurować bramkę. Wyciągasz z dokładnych wyników absolutne maksimum i stabilnie budujesz przewagę.` },
        { s: "Czarny Koń Typera", v: `Zaskakujesz wszystkich stabilną, wysoką formą. Twoje wyniki pokazują, że potrafisz zachować zimną krew, nawet gdy turniej zamienia się w totalny, nieprzewidywalny chaos.` }
      ];

      // KOSZYK 3: KLASA ŚREDNIA (OVR 66 - 74) - 10 komentarzy
      const tierMedium = [
        { s: "Ofiara doliczonego czasu", v: `Wiesz kto wygra, czujesz grę, ale Twoje dokładne wyniki palą się w piekle przez bramki padające po 90. minucie. Gdyby mecze trwały krócej, byłbyś królem. A tak? Środek tabeli.` },
        { s: "Średniak z Ambicjami", v: `Trafiasz czyste 1X2 całkiem sprawnie, ale ustrzelenie dokładnego wyniku to dla Ciebie misja na Marsa. Ciągle brakuje tej jednej bramki do szczęścia. Typer poprawny, ale bez błysku.` },
        { s: "Piłkarski Teoretyk", v: `Analizujesz składy, czytasz wywiady, a potem i tak wchodzi turniejowa niespodzianka i niszczy cały Twój plan. Masz wiedzę, ale piłkarze na boisku robią wszystko na przekór.` },
        { s: "Bezpieczny Gracz", v: `Zero ryzyka, zero zabawy. Stawiasz tak oczywiste wygrane faworytów, że Twoje punkty rosną w żółwim tempo. Jeśli nie zaryzykujesz jakiejś grubej wtopy, utkniesz w tym tłumie na zawsze.` },
        { s: "Stabilny Urzędnik", v: `Twoje typy są tak przewidywalne jak podatki. Nie zaliczasz spektakularnych upadków, ale Twoja karta nie ma szans na miano gwiazdy ligi. Solidna, rzemieślnicza praca bez grama polotu.` },
        { s: "Koneser Wyniku 1:1", v: `Masz manię bezpiecznych remisów lub skromnych wygranych. Przez tę asekurację ucieka Ci masa punktów za dokładne wyniki, kiedy drużyny nagle postanawiają urządzić sobie strzelaninę.` },
        { s: "Więzień Statystyk", v: `Sugerujesz się suchymi liczbami przed meczem, zapominając, że Mundial to turniej emocji i czystego chaosu. Twoje OVR krzyczy: 'Mogło być pięknie, ale wyszło jak zwykle'.` },
        { s: "Hamulec Ręczny", v: `Zamiast pójść na całość, w kluczowych momentach wciskasz hamulec i zmieniasz typ na nudny standard. Przez to trzymasz się bezpiecznego środka tabeli, z dala od szampana.` },
        { s: "Ofiara Systemu VAR", v: `Grasz dobrze, ale pech Cię nie opuszcza. Twoje dokładne wyniki są regularnie kasowane przez milimetrowe spalone wyłapywane przez technologię. Musisz zacząć brać poprawkę na sędziów.` },
        { s: "Turniejowy Turysta", v: `Kręcisz się w okolicach środka stawki, raz trafiając super wynik, a raz pudłując w banalnej sytuacji. Brak stabilizacji sprawia, że jesteś klasycznym, ligowym średniakiem.` }
      ];

      // KOSZYK 4: SŁABA FORMA (OVR 20 - 65) - 10 komentarzy
      const tierLow = [
        { s: "Pechowiec z Urzędu", v: `Twoje typy to pasmo nieszczęść. Wybierasz wygraną potęgi – zaliczają wtopę roku. Wybierasz dokładny wynik – napastnik nie trafia do pustej bramki z metra. Klasyczny dramat.` },
        { s: "Naiwny Optymista", v: `Typujesz wyniki rodem z hokeja (4:2, 5:1), zapominając, że na Mistrzostwach Świata drużyny wolą grać mądry, defensywny piach na 1:0. Ogląda się Twoje typy wesoło, ale punktów brak.` },
        { s: "Ofiara czarnego konia", v: `Wierzysz w wielkie marki z Europy, które na tym turnieju zapomniały jak się biega. Każda kolejna niespodzianka spycha Cię w otchłań, a Twoim koszmarem stała się ekipa: ${mainBadTeam}.` },
        { s: "Sabotażysta intuicji", v: `Zapewne masz tak, że najpierw myślisz o dobrym typie, a przed samym zatwierdzeniem zmieniasz zdanie i wpisujesz głupoty. Przestań przekombinowywać, bo dół tabeli już macha ręką.` },
        { s: "Ślepy Snajper", v: `Strzelasz w każdy możliwy wynik, ale celownik jest tak rozregulowany, że piłki latają po trybunach. Skuteczność trafionych dokładnych wyników drastycznie domaga się natychmiastowej reanimacji.` },
        { s: "Darczyńca Koleżeński", v: `Twoje zaangażowanie w grę jest piękne, ale korzyść z tego mają tylko Twoi rywale, którzy bezlitośnie uciekają Ci w klasyfikacji generalnej. Czas zmienić doradcę taktycznego.` },
        { s: "Kolekcjoner Spalonych", v: `Twoje typy wiecznie mijają się z linią obrony rywali. Albo przeceniasz formę strzelecką napastników, albo dramatycznie nie doceniasz skłonności bramkarzy do robienia baboli.` },
        { s: "Zakładnik Przeszłości", v: `Żyjesz sukcesami reprezentacji sprzed 10 lat. Typujesz na podstawie nazwisk, a na boisku biegają młode wilki, które bezlitośnie weryfikują Twoje przestarzałe poglądy piłkarskie.` },
        { s: "Mundialowy Zagubiony", v: `Turniej pędzi jak szalony, 104 mecze dają popalić, a Ty wyglądasz na kogoś, kto wszedł do złego autobusu. Twoje OVR zbliża się niebezpiecznie do strefy spadkowej.` },
        { s: "Ofiara Emocjonalna", v: `Typujesz sercem, a nie chłodnym umysłem. Chcesz, żeby mniejsi robili niespodzianki, a potęgi wygrywały pięknie. Futbol jednak jest brutalny i boleśnie niszczy Twoje marzenia.` }
      ];

      // SPECJALNY KOSZYK DLA EMIGRANTÓW (Walkowery)
      const ghostVerdicts = [
        "Twoje konto zarosło mchem. Oddajesz mecze walkowerem szybciej niż faworyci tracą bramki. Podobno utknąłeś w strefie kibica bez internetu.",
        "Oddajesz punkty bez walki. Puste pola w tabeli krzyczą o pomstę do nieba. Twoja absencja niszczy widowisko bardziej niż błędy sędziowskie.",
        "Wygląda na to, że pojechałeś na turniej tylko po to, żeby jeść darmowe krewetki w loży VIP, zamiast wysyłać kupony na czas. Żenada."
      ];

      // =========================================================
      // DYNAMICZNE PRZYPISANIE DO KOSZYKA (Z ZERO-BEZPIECZNIKIEM)
      // =========================================================
      const seed = user.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
      const textIndex = seed % 10;

      if (emptyBets > 15) {
        style = "Turysta z loży VIP";
        verdict = ghostVerdicts[seed % ghostVerdicts.length];
      } else if (outcomeCorrect === 0 && scoreCorrect === 0) {
        // TU WPADAJĄ KONESERZY ZERA PUNKTÓW
        style = tierAbsoluteZero[textIndex].s;
        verdict = tierAbsoluteZero[textIndex].v;
      } else if (OVR >= 85) {
        style = tierElite[textIndex].s;
        verdict = tierElite[textIndex].v;
      } else if (OVR >= 75) { 
        style = tierSolid[textIndex].s;
        verdict = tierSolid[textIndex].v;
      } else if (OVR >= 66) {
        style = tierMedium[textIndex].s;
        verdict = tierMedium[textIndex].v;
      } else {
        style = tierLow[textIndex].s;
        verdict = tierLow[textIndex].v;
      }

      // Kultowy Easter Egg dla Kuzyna
      if (user.toLowerCase().includes('kuzyn')) {
        style = "Chaotyczny Selekcjoner";
        verdict = "Twoje kupony potrafią zszokować zarówno zaawansowane algorytmy matematyczne, jak i samych zawodników biegających po murawie. Absolutna, nieprzewidywalna jazda bez trzymanki!";
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
            <h2 style={{ color: '#FFD700', margin: 0, fontWeight: 'bold' }}>🏆 Loża Szyderców i Chwały MŚ</h2>
            <div style={{ color: '#ff4d4d', fontSize: '0.75rem', marginTop: '5px', letterSpacing: '0.5px', fontWeight: '500' }}>
              * System analizuje 104 mecze. Gracze z 0 pkt lądują bezlitośnie w mule z zerowym OVR!
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
                  <div style={{ color: '#FFD700', fontSize: '0.7rem', fontWeight: 'bold' }}>👑 OFICJALNY KRÓL REMISÓW</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '4px' }}>{globalStats.kingOfDraws.users}</div>
                  <div style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.8rem' }}>{globalStats.kingOfDraws.count} trafionych "X"</div>
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
                  <div style={{ color: '#f44336', fontSize: '0.8rem' }}>{globalStats.mostEmpty.count} oddanych walkowerów</div>
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
                border: p.OVR <= 10 ? '2px dashed #ff4d4d' : '2px solid #2a2a2a',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ margin: 0, color: p.OVR <= 10 ? '#ff4d4d' : '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    👤 {p.user}
                  </h3>
                  <span style={{ color: p.OVR <= 10 ? '#ff4d4d' : '#FFD700', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {p.style}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ margin: 0, color: p.OVR <= 10 ? '#ff4d4d' : '#FFD700', fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>
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
                background: p.OVR <= 10 ? 'rgba(255, 77, 77, 0.05)' : 'rgba(255, 215, 0, 0.04)', 
                padding: '12px', 
                borderRadius: '8px', 
                borderLeft: p.OVR <= 10 ? '4px solid #ff4d4d' : '4px solid #FFD700', 
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
