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

    const rawProfiles = [];
    let absoluteMaxDrawsCorrect = 0;

    // Krok 1: Wyliczenie podstawowych statystyk graczy
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

        outcomeTotal++;
        if (bet.bet === actualOutcome) {
          outcomeCorrect++;
          if (bet.bet === 'X') drawBetsCorrect++;
        }
        
        if (bet.bet === 'X') drawBetsPredicted++;

        scoreTotal++;
        const [bh, ba] = bet.score.split(':').map(Number);
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

      if (drawBetsCorrect > absoluteMaxDrawsCorrect) {
        absoluteMaxDrawsCorrect = drawBetsCorrect;
      }

      const outcomeRate = outcomeTotal ? outcomeCorrect / outcomeTotal : 0;
      const scoreRate = scoreTotal ? scoreCorrect / scoreTotal : 0;

      let OVR = 0;
      if (outcomeCorrect === 0 && scoreCorrect === 0) {
        OVR = emptyBets > 0 ? Math.max(12 - emptyBets, 0) : 0; 
      } else {
        const baseOVR = 40; 
        const outcomeBonus = outcomeRate * 40; 
        const exactScoreBonus = scoreCorrect * 2.5; 
        OVR = Math.min(Math.round(baseOVR + outcomeBonus + exactScoreBonus), 100);
      }

      const validTeams = Object.entries(teamStats).filter(([_, v]) => v.total >= 2);
      const bestPointTeams = [...validTeams].sort((a, b) => b[1].points - a[1].points).slice(0, 3).map(([team]) => team);
      const worstPointTeams = [...validTeams].sort((a, b) => b[1].cost - a[1].cost).slice(0, 3).map(([team]) => team);

      rawProfiles.push({
        user, index, OVR, outcomeRate, scoreRate,
        outcomeCorrect, scoreCorrect, outcomeTotal, emptyBets, drawBetsPredicted, drawBetsCorrect,
        bestPointTeams, worstPointTeams
      });
    });

    // Krok 2: Generowanie dopasowanych logicznie komentarzy bez wpadek
    const output = rawProfiles.map(p => {
      const mainGoodTeam = p.bestPointTeams[0] || "reprezentacji";
      const mainBadTeam = p.worstPointTeams[0] || "faworytów";
      
      let style = "";
      let verdict = "";

      // POZIOM 1: ELITA (OVR >= 80)
      const tierElite = [
        { s: "Geniusz Taktyczny", v: `Czapki z głów! Twoja intuicja w tym turnieju to absolutna klasa światowa. Czytasz grę jak otwartą książkę, a liczba trafionych dokładnych wyników budzi podziw w całej lidze. Ekipa ${mainGoodTeam} to Twój klucz do sukcesu.`, draw: false },
        { s: "Mundialowy Ekspert", v: `Niewiarygodna regularność i potężna wiedza sportowa. Z łatwością omijasz pułapki fazy grupowej i stabilnie budujesz przewagę na szczycie. Rzadko kiedy spotyka się tak precyzyjne typy.`, draw: false },
        { s: "Władca Szklanej Kuli", v: `Grasz w swojej własnej, mistrzowskiej lidze. Kiedy inni gubią punkty na niespodziankach, Ty spokojnie inkasujesz pełną pulę. Twoje oko do detali zasługuje na złoty medal.`, draw: false },
        { s: "Profesor Futbolu", v: `To nie jest przypadek, to jest czysta profeska. Twoje wysokie OVR odzwierciedla świetne zrozumienie dynamiki turnieju. Reszta stawki z zazdrością spogląda na Twoje genialne statystyki.`, draw: false },
        { s: "As Wywiadu Sportowego", v: `Fenomenalna forma! Masz niesamowity nos do ofensywnych zespołów, a Twoje precyzyjne strzały w dokładne rezultaty to ozdoba naszej ligi. Wielkie brawa za dotychczasowe osiągnięcia.`, draw: false },
        { s: "Strateg Nowej Ery", v: `Imponująca chłodna głowa i analityczny umysł. Twoja przewaga w tabeli to w pełni zasłużony owoc trafnych decyzji. Drużyna ${mainGoodTeam} przynosi Ci najwięcej powodów do dumy.`, draw: false },
        { s: "Mundialowy Strateg", v: `Klasa, elegancja i bezwzględna skuteczność na kuponach. Twoje predykcje wyznaczają trendy w tej edycji. Trzymaj to tempo, bo podium i puchar są już na wyciągnięcie ręki.`, draw: false },
        { s: "Analityk Premium", v: `Twoja karta OVR świeci czystym złotem. Świetnie wyczuwasz, kiedy faworyci mogą mieć gorszy dzień i potrafisz to perfekcyjnie obrócić w cenne punkty. Zasłużone miejsce w elicie.`, draw: false },
        { s: "Łowca Wyników", v: `Oglądanie Twoich postępów w tabeli to czysta przyjemność dla oka. Trafiasz najtrudniejsze spotkania z lekkością rutyniarza. Jesteś obecnie głównym pretendentem do końcowego triumfu.`, draw: false },
        { s: "Mistrz Przewidywania", v: `Niewiarygodny instynkt snajpera. Twoje typy 1X2 rzadko kiedy mijają się z prawdą, a skuteczność z doliczonego czasu gry zasługuje na miano fenomenu tych mistrzostw.`, draw: false }
      ];

      // POZIOM 2: SOLIDNY GRACZ (OVR 68 - 79)
      const tierSolid = [
        { s: "Solidny Rzemieślnik", v: `Bardzo dobra, stabilna forma. Trzymasz się blisko ścisłej czołówki i w każdej chwili możesz zaatakować podium. Masz świetny bilans czystych wygranych, brakuje tylko ciut szczęścia do wyników.`, draw: false },
        { s: "Czarny Koń Turnieju", v: `Pokazujesz bardzo mądry futbol na kuponach. Wyłapujesz dobre mecze i regularnie punktujesz. Jeśli podkręcisz dokładne wyniki, liderzy zaczną poważnie drżeć o swoje pozycje.`, draw: false },
        { s: "Mundialowy Wojownik", v: `Dobra, rzemieślnicza robota. Twoje OVR pokazuje, że znasz się na rzeczy i potrafisz podjąć skalkulowane ryzyko. Zespół ${mainGoodTeam} stabilizuje Twoją pozycję w górnej połowie.`, draw: false },
        { s: "Strateg Środka Pola", v: `Grasz mądrze i bez większych przestojów. Unikasz spektakularnych wpadających wpadek, co w tak nieprzewidywalnym turnieju jest wielką sztuką. Twoja taktyka przynosi stabilne owoce.`, draw: false },
        { s: "Ambitny Ścigający", v: `Stabilizacja to Twoje drugie imię. Punkty rosną regularnie z każdą kolejką. Widać, że turniej sprawia Ci frajdę, a wiedza piłkarska pozwala na spokojne kontrolowanie grupy pościgowej.`, draw: false },
        { s: "Analityk z Pasją", v: `Twoja karta prezentuje się bardzo obiecujuco. Wykazujesz duże wyczucie intencji selekcjonerów, a drobne potknięcia przez ${mainBadTeam} to tylko wypadek przy pracy. Dobre perspektywy.`, draw: false },
        { s: "Mundialowy Aktywista", v: `Solidne punkty zdobywane z pełnym zaangażowaniem. Twoja skuteczność 1X2 jest na bardzo zadowalającym poziomie. Trzymaj kurs, a końcówka turnieju będzie Twoja.`, draw: false },
        { s: "Ekspert Regionalny", v: `Grasz pewnie i z pomysłem. Twoje analizy przynoszą stabilny zysk w tabeli generalnej. Jeśli zachowasz tę zimną krew do fazy pucharowej, zameldujesz się na pudle.`, draw: false },
        { s: "Oko Skauta", v: `Dobra intuicja do młodych, dynamicznych reprezentacji. Potrafisz docenić teoretycznie słabszych, co owocuje cennymi punktami. Dobry, stabilny poziom sportowy.`, draw: false },
        { s: "Biegiem po Podium", v: `Forma zwyżkuje z meczu na mecz. Początek mógł być spokojny, ale teraz włączasz wyższy bieg. Rywale przed Tobą muszą oglądać się za siebie, bo idziesz jak po swoje.`, draw: false },
        { s: "Mundialowy Dyplomata", v: `Wybierasz bezpieczne, ale bardzo zyskowne rozwiązania. Twoja wysoka pozycja w zestawieniu 23 graczy to dowód na to, że systematyczność jest kluczem do sukcesu.`, draw: false },
        { s: "Magik Wyników 1X2", v: `Masz rewelacyjny procent trafionych czystych rozstrzygnięć. Twoje predykcje dotyczące zwycięzców są niezwykle celne, co pozwala Ci pewnie i stabilnie piąć się w górę zestawienia.`, draw: false },
        { s: "Władca Środka Tabeli", v: `Solidna pozycja wyjściowa przed decydującą fazą pucharową. Masz bardzo zbalansowany arkusz i potrafisz wyciągać cenne punkty z pojedynków faworytów. Dobra robota.`, draw: false }
      ];

      // POZIOM 3: KLASA ŚREDNIA (OVR 40 - 67)
      const tierMedium = [
        { s: "Ofiara 90. Minuty", v: `Masz dużą wiedzę, ale pech w doliczonym czasie gry odbiera Ci mnóstwo punktów. Gdyby mecze kończyły się w 85. minucie, byłbyś w ścisłej czołówce. A tak? Środek tabeli.`, draw: false },
        { s: "Stabilny Urzędnik", v: `Twoje typy są poprawne, ale brakuje im odrobiny polotu i ryzyka. Stawiasz głównie na faworytów domowych, przez co w tak szalonym turnieju kręcisz się w szarym tłumie stawki.`, draw: false },
        { s: "Piłkarski Romantyk", v: `Typujesz sercem i pięknem futbolu, a boiskowa rzeczywistość brutalnie weryfikuje te plany. Trochę za dużo wiary w wielkie marki, które na turniej przyjechały bez formy.`, draw: false },
        { s: "Typer Falujący", v: `Potrafisz jednego dnia ustrzelić genialny dokładny wynik, by następnego spudłować trzy proste mecze z rzędu. Brak stabilizacji trzyma Cię w bezpiecznej odległości od szampana.`, draw: false },
        { s: "Więzień Statystyk", v: `Zbyt mocno wierzysz w suche liczby przedmeczowe, zapominając, że Mundial to turniej czystego chaosu i emocji. Twoje OVR krzyczy: 'Potencjał był, ale wyszło jak zwykle'.`, draw: false },
        { s: "Hamulec Taktyczny", v: `Zamiast zaufać pierwszej myśli, przekombinowujesz przed samym zatwierdzeniem kuponu. Przez to uciekają cenne punkty, a ekipa ${mainBadTeam} regularnie psuje Ci humor.`, draw: false },
        { s: "Mundialowy Średniak", v: `Klasyczny przedstawiciel środkowej strefy stanów średnich. Nie ma tragedii, ale szału też nie ma. Solidna, rzemieślnicza praca, która potrzebuje iskry bożej i odwagi.`, draw: false },
        { s: "Ofiara Systemu VAR", v: `Grasz dobrze, ale technologia Cię nie kocha. Twoje potencjalne dokładne wyniki są regularnie kasowane przez milimetrowe spalone. Musisz zacząć brać poprawkę na sędziów.`, draw: false },
        { s: "Mundialowy Turysta", v: `Wpadłeś tu głównie dla dobrej zabawy i zimnego piwka przy meczu, co widać po Twoich zrelaksowanych typach. Środek tabeli w pełni oddaje Twój rekreacyjny styl gry.`, draw: false },
        { s: "Ekspert z Kanapy", v: `W teorii wiesz wszystko najlepiej, ale przełożenie tego na realne wyniki w tabeli idzie opornie. Potrzebujesz jednego, mocnego przełamania, żeby ruszyć w górę stawki.`, draw: false },
        { s: "Zakładnik Sentymentów", v: `Ciągle wierzysz w gwiazdy sprzed lat, które na tym turnieju głównie truchtają. Futbol poszedł do przodu, czas zaktualizować bazę danych i przestać tracić punkty.`, draw: false },
        // Poniższe teksty zawierają wzmianki o remisach - system użyje ich TYLKO, gdy p.drawBetsCorrect > 0
        { s: "Koneser Wyniku 1:1", v: `Twoja asekuracyjna taktyka na skromne remisy chroni Cię przed dnem tabeli, ale jednocześnie skutecznie blokuje awans do czołówki. Czasem warto zaryzykować.`, draw: true },
        { s: "Strażnik Podziału Punktów", v: `Szukasz remisów tam, gdzie inni boją się zaryzykować. Kilka razy przyniosło to świetny zysk, ale ogólny bilans trzyma Cię stabilnie w środkowej części stawki.`, draw: true }
      ];

      // POZIOM 4: DÓŁ TABELI (OVR < 40)
      const tierBottom = [
        { s: "Dno i metr mułu", v: `Oficjalne, certyfikowane podziemie tej ligi. Twój bilans punktowy wygląda jak stan konta po studenckich wakacjach. Gdyby w tej lidze były spadki, lądujesz w okręgówce.`, draw: false },
        { s: "Piłkarski Niewidzialny", v: `Twoja intuicja sportowa schowała się tak głęboko w mule, że potrzebujemy ekipy ratunkowej. Nawet rzucając monetą miałbyś większą skuteczność. Totalny klops.`, draw: false },
        { s: "Anty-Jasnowidz Ligi", v: `Masz niesamowity, unikalny talent: typujesz tak spektakularnie źle, że reszta z 23 graczy powinna płacić Ci za podpowiedzi, żeby móc obstawić dokładnie na odwrót.`, draw: false },
        { s: "Sponsor Punktów", v: `Siedzisz na samym dole tabeli i dzielnie poprawiasz humor całej reszcie stawki. Twoja obecność tutaj jest wybitnie towarzyska, bo z rywalizacją ma niewiele wspólnego.`, draw: false },
        { s: "Generator Losowych Liczb", v: `Czy przed każdą kolejką rzucasz kostką w ciemnym pokoju? Liczba trafionych wyników szoruje po dnie, a drużyna ${mainBadTeam} ostatecznie grzebie Twoje marzenia.`, draw: false },
        { s: "Wstyd i Ubóstwo", v: `Nawet najstarsi eksperci nie pamiętają tak spektakularnego zjazdu formy. Masz mniej punktów niż ekipy, które odpadły w eliminacjach. Czas wyłączyć komputer.`, draw: false },
        { s: "Maskotka Tabeli", v: `Zamknąłeś stawkę z kłódką, a klucz wrzuciłeś do najbliższej rzeki. Reszta ligi dziękuje za tak mało wymagającego rywala. Przynajmniej stabilnie trzymasz czerwoną latarnię.`, draw: false },
        { s: "Koszmar Taktyczny", v: `Twoje prognozy obrażają dyscyplinę sportową, jaką jest piłka nożna. Nawet ślepy traf by czasem coś ugrał, a Ty uparcie trzymasz się dna. Absolutna kompromitacja.`, draw: false },
        { s: "Władca Podziemia", v: `Osiągnąłeś stan absolutnego zera taktycznego. Twoja karta OVR wzbudza szczery żal i uśmiech politowania na grupie. Gorzej fizycznie nie dało się tego rozegrać.`, draw: false },
        { s: "Analfabeta Turniejowy", v: `Twoje wyczucie bramek działa w trybie wstecznym. Tam gdzie sypią się gole, Ty stawiasz na nudne rezultaty, a tam gdzie murują – czekasz na hokejowy wynik. Tragedia.`, draw: false },
        { s: "Taktyczny Sabotażysta", v: `Twoje analizy przedmeczowe musiały opierać się na śledzeniu pogody w zupełnie innym kraju. Nic tu się nie trzyma kupy, a Twoje punkty po prostu wyparowały.`, draw: false },
        { s: "Kibic Sukcesu Widmo", v: `Ogólny obraz Twojej taktyki przypomina krajobraz po przejściu tornada. Kompletny brak formy turniejowej, zagubienie w terminarzu i zasłużona lokata na samym dnie.`, draw: false }
      ];

      const ghostVerdicts = [
        "Twoje konto zarosło mchem. Oddajesz mecze walkowerem szybciej niż faworyci tracą bramki. Podobno utknąłeś w strefie kibica bez internetu.",
        "Oddajesz punkty bez walki. Puste pola w tabeli krzyczą o pomstę do nieba. Twoja absencja niszczy widowisko bardziej niż błędy sędziowskie.",
        "Wygląda na to, że pojechałeś na turniej tylko po to, żeby jeść darmowe krewetki w loży VIP, zamiast wysyłać kupony na czas. Żenada."
      ];

      // SEED I WYBÓR KOSZYKA
      const seed = p.user.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + p.index;

      if (p.emptyBets > 15) {
        style = "Turysta z loży VIP";
        verdict = ghostVerdicts[seed % ghostVerdicts.length];
      } 
      // BEZPIECZNIK DLA KRÓLA REMISÓW (Jeżeli ktoś ma ich najwięcej w lidze i powyżej zera)
      else if (p.drawBetsCorrect === absoluteMaxDrawsCorrect && p.drawBetsCorrect > 0) {
        style = "Oficjalny Król Remisów";
        verdict = `Genialny, turniejowy nos do najbardziej ryzykownych spotkań. Podczas gdy cała liga stawia na pewniaków, Ty bezbłędnie namierzasz podziały punktów i inkasujesz potężne premie za iksy. Absolutny unikat!`;
      } 
      else {
        // Dobranie odpowiedniej puli pod kątem OVR
        let currentTier = [];
        if (p.OVR >= 80) currentTier = tierElite;
        else if (p.OVR >= 68) currentTier = tierSolid;
        else if (p.OVR >= 40) currentTier = tierMedium;
        else currentTier = tierBottom;

        // INTELIGENTNA FILTRACJA: Usuwamy teksty o remisach, jeśli użytkownik ma 0 trafionych remisów!
        const filteredTier = currentTier.filter(item => {
          if (p.drawBetsCorrect === 0 && item.draw === true) return false;
          return true;
        });

        const textIndex = seed % filteredTier.length;
        style = filteredTier[textIndex].s;
        verdict = filteredTier[textIndex].v;
      }

      // Kultowy Easter Egg dla Kuzyna
      if (p.user.toLowerCase().includes('kuzyn')) {
        style = "Chaotyczny Selekcjoner";
        verdict = "Twoje kupony potrafią zszokować zarówno zaawansowane algorytmy matematyczne, jak i samych zawodników biegających po murawie. Absolutna, nieprzewidywalna jazda bez trzymanki!";
      }

      return { ...p, style, verdict };
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
            <h2 style={{ color: '#FFD700', margin: 0, fontWeight: 'bold' }}>🏆 Loża Ekspertów i Szyderców MŚ</h2>
            <div style={{ color: '#4caf50', fontSize: '0.75rem', marginTop: '5px', letterSpacing: '0.5px', fontWeight: '500' }}>
              * Rywalizacja {profiles.length} graczy. Komentarze sprawdzają logikę remisów i dopasowują werdykt do faktów!
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

          {profiles.map((p, idx) => {
            let cardBorder = '#2a2a2a';
            let ovrColor = '#FFD700';
            let verdictBg = 'rgba(255, 215, 0, 0.04)';
            let accentColor = '#FFD700';

            if (p.style === "Oficjalny Król Remisów") {
              cardBorder = '2px solid #00e5ff';
              ovrColor = '#00e5ff';
              verdictBg = 'rgba(0, 229, 255, 0.05)';
              accentColor = '#00e5ff';
            } else if (p.OVR >= 80) {
              cardBorder = '2px solid #FFD700';
              ovrColor = '#FFD700';
              verdictBg = 'rgba(255, 215, 0, 0.05)';
            } else if (p.OVR >= 68) {
              cardBorder = '2px solid #c0c0c0';
              ovrColor = '#c0c0c0';
              verdictBg = 'rgba(192, 192, 192, 0.05)';
              accentColor = '#c0c0c0';
            } else if (p.OVR < 40) {
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
                    <h3 style={{ margin: 0, color: p.OVR < 40 ? '#ff4d4d' : '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                  <span>Remisy (Wytypowane / TRAFIONE): {p.drawBetsPredicted} / <strong style={{ color: '#FFD700' }}>{p.drawBetsCorrect}</strong></span>
                  <span>Puste typy (:::): {p.emptyBets}</span>
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
