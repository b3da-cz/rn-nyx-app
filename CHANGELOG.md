# Changelog

## 0.35.6
- ve výběru modelu je v hlavičce tlačítko pro znovunačtení seznamu z API

## 0.35.5
- v anketě se vykreslí HTML, takže obrázek v instrukcích nebo odpovědi je vidět
- delší odpověď se neořízne a řádek vyroste
- rámečky hlasování a odpovědí jsou hranaté
- po skončení ankety je tlačítko hlasování vypnuté

## 0.35.4
- karta úvahy drží za úchyt pod prstem a je o kousek vyšší

## 0.35.3
- karta úvahy jde scrollovat a za horní úchyt zvětšit, zmenšit nebo stáhnout pryč
- dokud úvaha v asistentu přibývá a karta je zavřená, tlačítko za názvem pulzuje tečkami

## 0.35.2
- při automatickém scrollování odpovědi raw, kopírovat a nový dotaz sedí nad spodním okrajem

## 0.35.1
- během odpovědi asistenta se pohled drží na konci, dokud uživatel nevyjede kousek nahoru
- po dopsání odpovědi pohled zůstane tam, kde uživatel čte

## 0.35.0
- odpověď asistenta přichází po částech a formátuje se až po uzavření tagu
- úvaha modelu je zvlášť, otevře se kartou zespoda

## 0.34.3
- dev build se na ploše jmenuje Nnn [dev]

## 0.34.2
- Google Play tester po zadání jména uvidí pole pro token a přihlásí se až tím zadaným tokenem
- pole pro token se ukáže jen u přesného testovacího jména

## 0.34.1
- přezdívky v odpovědi asistenta se vrátí i když model zahodí předponu USER_
- v nastavení jde v cache držet až 1000 posledních klubů

## 0.34.0
- asistent umí vedle OpenRouteru vlastní OpenAI endpoint a klíč
- po zadání adresy a klíče se model vybírá stejně jako u OpenRouteru
- adresa může být i http, třeba model v místní síti
- při psaní adresy a klíče v nastavení pole nezůstane pod klávesnicí

## 0.33.4
- rozbalená navigace nechá pod poslední položkou místo, aby nezůstala pod systémovou lištou

## 0.33.3
- v O aplikaci jde seznam doscrollovat až na poslední jméno

## 0.33.2
- souhrn v klubu s nenulovým časem smazání nejde kopírovat ani označit
- dokud je takový rozbalený souhrn na obrazovce, jsou vypnuté screenshoty; po skrytí platí zase nastavení ochrany

## 0.33.1
- tlačítko nové zprávy v mailu zůstává dole jako v diskuzi

## 0.33.0
- rozepsaná zpráva v klubu zůstane po vypnutí aplikace, v každém klubu zvlášť
- v mailu se text vrátí po zadání stejné přezdívky
- odeslání nebo vymazání textu ten koncept smaže

## 0.32.0
- asistent v klubu čte ze záhlaví, kdo ho smí spustit a za jak dlouho se výsledek smaže
- když na agenta nemáš právo, odeslání je vypnuté a vyskočí hláška
- čas smazání je v záhlaví červeně, role taky, pokud na ni nemáš právo
- výsledek s časem smazání má odpočet a po vypršení zmizí z knihovny
- přezdívky se do modelu posílají anonymně a v odpovědi se vrátí
- příspěvky s [agents:ignore] se vynechají a jejich počet je červeně u nalezených příspěvků

## 0.31.5
- nastavení při změně už neblikne a neskočí nahoru, když je odscrollované

## 0.31.4
- notifikace o načtení z mezipaměti se zobrazí pouze při chybě sítě, ne při běžném online načtení

## 0.31.3
- offline se načtou uložené příspěvky klubu i při nesouladu čísla stránky či změně naposledy viděného příspěvku
- spolehlivý přechod na nejnovější příspěvky z cache, když konkrétní starší offset není uložen

## 0.31.2
- kluby se ukládají v mezipaměti odděleně, takže velká cache nenarazí na limit Android CursorWindow
- historie a záložky se při prázdném nebo přečteném stavu nepřemažou
- limit velikosti AsyncStorage na Androidu je navýšen na 50 MB
- dočasná chyba čtení z úložiště nepřepíše data prázdnou mezipamětí
- seznam uložených klubů v nastavení používá FlatList a je spolehlivě scrollovatelný


## 0.31.1
- cache se už nesmaže, když se klub, historie a záložky zapisují najednou
- historie a záložky se ukážou hned a ukládají se odděleně od klubů
- klub se načte, i když se zrovna zapisuje seznam
- poškozené čtení cache nezablokuje další ukládání

## 0.31.0
- cache klubů ukládá příspěvky, rozměry a velikosti obrázků a výšku textu
- v nastavení jde cache zapnout a zvolit počet posledních klubů, výchozí je 30
- online se načtený klub vždy aktualizuje, offline se berou uložené stránky
- poslední historie a záložky zůstanou, aby se do klubu dalo dostat offline
- u chyby spojení je jedna hláška a při cache i věta, že jde o poslední známý stav
- nastavení ukazuje velikost a obsah cache a dialog se seznamem klubů
- klub i celá cache se mažou dvojitým klepnutím

## 0.30.4
- na konci klubu se po prázdné stránce starších příspěvků ukáže začátek klubu
- nová instalace má všude celkový průběh načítání

## 0.30.3
- donačtení klubu přepočítá jen nové příspěvky, ne celý zobrazený seznam
- průběh načítání je detailní, nebo nic (obyčejný spinner)
- při otevření a při donačtení v klubu mají vlastní volbu
- oznámení, upomínky, poslední, pošta a hledání mají společnou volbu

## 0.30.2
- řádky průběhu jsou hranaté karty stejné výšky a popisky jsou bílé
- u celkového načítání je název a procenta tučně
- ceny na podpoře vývoje mají hranaté rohy
- nastavení je v sekcích na kartách
- hlavička sekce jde sbalit, zavřená má plus a stav si aplikace pamatuje

## 0.30.1
- v obecném nastavení jde zapnout průběh načítání
- při otevření a při donačtení v klubu jde zvolit vypnuto, celkový, nebo detailní
- výchozí je zapnuto, při otevření detailní a v klubu celkový

## 0.30.0
- při načítání klubu, příspěvků, pošty, upomínek, hledání a oznámení je nahoře průběh prefetchu
- řádky přibývají podle kroku: request, mezipaměť, velikost souboru, rozměry a výška příspěvků
- nahoře je celkový průběh, pod řádky spinner ve zbylém místě
- měření velikosti souboru se po 8 s vzdá, aby jeden request nezastavil načtení

## 0.29.1
- hledaná fráze v příspěvku má sytější podklad jako vybraná shoda a zůstává kurzívou

## 0.29.0
- hledání přepíná vše, kluby, inzeráty, události, uživatele a příspěvky
- nadpisy sekcí jsou jen u vše, ostatní druhy jsou obyčejný seznam
- příspěvky jsou celé; text otevře diskuzi, odkazy a obrázky fungují
- hledaná fráze v příspěvku má podklad jako jinde, ne kurzívu z API
- klepnutí na uživatele otevře poštu s předvyplněným jménem
- odhlášení z notifikací posílá identifikátor aplikace

## 0.28.1
- hlas pro a hlas proti jsou vedle sebe
- u tlačítek je ikona palce, rohy zůstávají hranaté

## 0.28.0
- žádost o nový klub má hlas pro a hlas proti
- tlačítka jsou přes celou šířku, bez zaoblení, jako hod kostkou

## 0.27.6
- veřejná poznámka má v seznamu ikonu glóbu
- datum a ikona zámku nebo glóbu jsou ve sloupcích pod sebou

## 0.27.5
- hledání má společné pole: vlevo lupa, vpravo křížek, když je v něm text
- stejné pole je u seznamu poznámek, prohlížeče souborů, knihovny asistenta a vyhledávání

## 0.27.4
- u veřejné poznámky ve FAB není odkaz na čtečku
- sdílení se jmenuje Share - standard a Share - reader
- nad seznamem je hledání, které hned filtruje názvy a skryje prázdné kategorie

## 0.27.3
- seznam poznámek bere kategorie z API a ukazuje je jako sekce
- nezařazené poznámky jsou až pod ostatními kategoriemi
- veřejná poznámka má vlevo primary border, soukromá zámek a název na 90 %
- v řádku je datum poslední změny

## 0.27.2
- v detailu záznamu jsou vytvořeno a poslední změna vpravo v hlavičce
- druhý pruh s názvem a časy je pryč
- záložky, hledání a obsah jdou přes celou šířku

## 0.27.1
- detail záznamu ukazuje vytvořeno i poslední změnu
- text jde označit; markdown, js, json, csv a log se zobrazí jako soubor, včetně raw
- pod FAB úpravy je kopie obsahu a odkazy na standardní zobrazení a čtečku

## 0.27.0
- v profilu je zápisník: seznam, detail a nový záznam
- nový záznam a úprava jdou přes web, čtení je v aplikaci

## 0.26.1
- v posledních příspěvcích je vedle přátel filtr hodnoceno mnou
- přátelé, hodnoceno mnou a minimum jdou jen zvlášť; přátelé mají přednost, pak hodnoceno mnou, pak minimum

## 0.26.0
- vypnuté video tagy u nahraných videí zůstanou vypnuté

## 0.25.1
- u nahraného souboru v dialogu zprávy jde přepnout vložení jako obrázek, nebo jako odkaz na soubor
- každý soubor začíná jako obrázek a přepíná se zvlášť

## 0.25.0
- textové soubory .md, .js, .json, .txt, .log a .csv se otevírají v aplikaci
- u odkazu na takový soubor je volba stáhnout, nebo otevřít
- z průzkumníka se soubor otevře přímo v prohlížeči
- prohlížeč má zdroj a formátované zobrazení, hledání s přechodem mezi výskyty a u markdownu tabulky

## 0.24.1
- v dialogu práv jde u uživatele nastavit počet dnů, od neomezeně po 999999

## 0.24.0
- zámek otiskem prstu, výchozí vypnuto; pod ním volba, za jak dlouho znovu chtít otisk
- zakrytí aplikace proti screenshotu a v přehledu aplikací, výchozí vypnuto

## 0.23.4
- odebrání v dialogu práv je červeně, druhé klepnutí má červený podklad a text s otazníkem
- v hlavičce dialogu je vlevo od jména avatar uživatele

## 0.23.3
- v dialogu práv jde uživatele odebrat, druhé klepnutí je jen fajfka

## 0.23.2
- ve FAB jsou práva nad statistikami
- hledání v právech je v hlavičce nad jmény, ve výpisu změn pod záložkami
- hledání ignoruje diakritiku a zvýrazní nalezenou frázi

## 0.23.1
- do práv diskuze lze přidat uživatele
- změna nástěnky se ve výpisu změn ukáže jako správa nástěnky

## 0.23.0
- práva diskuze z rozbaleného menu v diskuzi
- tabulka práv, úpravy v dialogu a výpis změn s datem u jména

## 0.22.11
- menu velikosti a kvality jpeg je nad dialogem zprávy

## 0.22.10
- změna systémového fontu nespouští znovu aktivitu
- karta rozbalené navigace se dá scrollovat, když se položky nevejdou
- hlavičky sekcí a volba velikosti jpeg se při velkém fontu neořezávají

## 0.22.9
- řádky diskuzí, přátel a hlavičky sekcí se při velkém systémovém fontu neořezávají
- výška příspěvku počítá systémové písmo přes SP, ne lineárně
- čísla v odznacích se se systémovým fontem nezvětšují

## 0.22.8
- příliš velký soubor hlásí in-app notifikace; pod 1 MB v kB, od 1 MB v MB na 3 desetinná místa
- počet nahraných souborů je nad ikonou souboru
- načtení novější stránky v klubu skočí na poslední příspěvek té stránky

## 0.22.7
- v obecném nastavení je přepínač video tagu u nahraných videí, výchozí je zapnuto
- příloha od 10 MB se nenahraje a ukáže se chyba s velikostí v kB

## 0.22.6
- nahrané video už nepřidá druhý přehrávač, v příspěvku zůstane jeden

## 0.22.5
- větší rozestupy mezi ikonami v patičce dialogu zprávy

## 0.22.4
- dialog zprávy se po zavření klávesnice už nerozšíří pod řadu ikon

## 0.22.3
- dialog zprávy sedí těsně nad klávesnicí a řada ikon je celá vidět
- nižší patička s ikonami

## 0.22.2
- dialog zprávy zůstane nad klávesnicí a nezmizí z displeje

## 0.22.1
- v diskuzi zůstanou příspěvky novější než poslední viděný z okamžiku otevření označené jako nepřečtené po celou dobu, co je diskuze otevřená

## 0.22.0
- sdílení textu a souborů (obrázky, videa, přílohy) z ostatních aplikací do Nyxu (do diskuzí i do pošty)
- sdílení obrázků z interní galerie aplikace přímo do pošty s automatickým nahráním přílohy
- dialog výběru cíle sdílení (diskuze / pošta) v designu aplikace s náhledem obsahu
- výběr diskuze se seznamem 5 naposledy navštívených klubů a vyhledáváním
- komprese a zmenšování sdílených obrázků podle nastavení v dialogu zprávy s ukládáním preferencí
- oprava zobrazení a překrývání FAB tlačítek mezi diskuzí a poštou
- oprava navigace do pošty ze sdílení i z in-app a systémových notifikací
- oprava lokalizační funkce t() na Hermes enginu a zamezení rekurzivního pádu chybového handleru

## 0.21.3
- zobrazení zakoupených položek podpory v profilu s odznáčky počtu kusů
- možnost volby jazyka aplikace v nastavení (Auto / Čeština / English)
- poděkování po nákupu přes in-app notifikaci se srdíčkem
- oprava pádu aplikace po nákupu při zobrazení in-app notifikace
- periodická 24h synchronizace zakoupených položek z Google Play

## 0.21.2
- vizuální odlišení nedostupných / nepotvrzených produktů v obrazovce podpory (snížená opacita, odstranění levého borderu, orientační cena se znakem ~)
- in-app notifikace s pulzující chybovou ikonou při klepnutí na položku nedostupnou v dané oblasti

## 0.21.1
- sjednocení designu dialogu hodnocení (RatingPromptComponent) se zbytkem aplikace (nativní Paper Dialog a ButtonComponent)
- přepracování obrazovky podpory (SupportView) do signaturního stylu řádků Nyx s levým akcentním proužkem a vlněním

## 0.21.0
- podpora vývoje aplikace formou In-App nákupů na Google Play
- ikona podpory v profilu vedle O aplikaci a responsivní sbalení řady ikon do kontextového menu pod 3 svislé tečky na menších displejích

## 0.20.0
- výzva k hodnocení na Google Play (vyskakovací karta zespodu displeje s možností ohodnotit nebo odložit na později)

## 0.19.4
- deletable replies v mailu

## 0.19.3
- aktualizace odkazu pro autorizaci aplikace na přihlašovací obrazovce (nastavení propojených aplikací na Nyx.cz)

## 0.19.2
- oprava nefunkčního Android gesta zpět po návratu aplikace z pozadí (přepsání invokeDefaultOnBackPressed v MainActivity a obnova callbacku při onResume, fallback v NestedBackHandler)

## 0.19.1
- oprava vykreslování avatarů uživatelů ve výsledcích LLM (zamezení konfliktu s označením textu na Androidu, explicitní předávání nastavení a robustnější extrakce uživatelských jmen)

## 0.19.0
- oprava výpočtu výšky příspěvků ve flatlistu se zohledněním systémového měřítka písma (fontScale)
- oprava ořezávání posledního příspěvku v diskuzi: FlatList má flex: 1 namísto přetékající 100% výšky s horním odsazením a bezpečný spodní padding pro linku gest/FAB
- kontejner příspěvku používá minHeight pro zamezení oříznutí textu při drobných odchylkách měření

## 0.18.0
- v obecném nastavení jde zapnout rozbalovací navigační lišta; tažení lišty prstem do středu displeje ji nechá sledovat prst (lze zastavit, vrátit i dokončit), lišta se fadeuje do karty, která vyjíždí z kraje displeje; taby se přepínají jen z karty a ta se dá tažením zpět k okraji zavřít

## 0.17.6
- v poště pod swipem doleva u odeslaných zpráv remind a delete, u přijatých reply, remind a nahlasit

## 0.17.5
- swipeable header na zprávách v poště

## 0.17.4
- text příspěvků, mailů a výsledků asistenta jde označit a zkopírovat
- v obecném nastavení je přepínač označování textu, zapnutý

## 0.17.3
- ikona aplikace je adaptivní znak N, bez šedého rámečku, a na kruhové masce se kroužky neořezávají

## 0.17.2
- asistent ukládá a nabízí vlastní šablony promptu
- výchozí šablony jdou ve stejném dialogu přepsat a smazat

## 0.17.1
- model vybraný v asistentovi se použije v dalším dotazu, jako výchozí se uloží jen se zapnutým přepínačem
- systémový prompt se uloží jako výchozí až po potvrzení se zaškrtnutým uložením

## 0.17.0
- LLM asistent přes OpenRouter se zapíná v profilu, klíč zůstává jen v zařízení
- asistent a knihovna mají výběr modelu, vlastní instrukce, historii a frontu dotazů na pozadí
- v podmínkách a v About je odkaz na zásady ochrany soukromí

## 0.16.4
- hlavička časové osy je Timeline událostí a počet dní ukazuje jako 1 den, 2 dny nebo 5 dní
- linky mezi dny jsou 1 px a končí se stejnou mezerou před nulou
- výběr počtu dní v hlavičce už po klepnutí nezůstane na staré hodnotě

## 0.16.3
- časová osa má vpravo stupnici po 6 hodinách s časy 0, 6, 12 a 18, pod kartami událostí
- od šesti dní na displej zůstávají jen časy 0 a 12, do tří dnů přibývají i hodinové značky

## 0.16.2
- na časové ose je v aktuálním čase čára přes šířku a počet dní je i v hlavičce
- ikony na kartě jsou dole jen když se vejdou pod text a vedle sebe se vejde víc než tři

## 0.16.1
- časová osa má v obecném nastavení počet dní na výšku displeje, výchozí je 5
- karta události na ose už neukazuje text účasti

## 0.16.0
- časová osa událostí z rozbaleného FAB: minulost nahoře, sedm dní na displej, blok od času začátku do konce

## 0.15.7
- galerie má počet fotek vlevo nad velikostí a tapnutí schová i ikony

## 0.15.6
- diskuze se seznamem inzerátů nebo událostí nemá ve FAB nový příspěvek, šipka zpět ho sbalí

## 0.15.5
- příspěvek typu událost v diskuzi se vykreslí jako řádek seznamu událostí

## 0.15.4
- filtr událostí drží hledání 20 px pod kalendářem a výška karty sleduje počet týdnů
- na malé obrazovce karta zůstane přes celou plochu a Smazat s Hledat jsou dole

## 0.15.3
- kalendář událostí má menší podbarvení dnů a mezeru mezi rámečkem a výplní

## 0.15.2
- dialog účastníků má u mě stejný levý okraj jako u přátel
- seznam událostí nemá u ikon odznak účasti

## 0.15.1
- účast na události se po uložení načte znovu, jméno je seřazené a ve verzálkách
- na seznamu i detailu je moje ikona první před přáteli, v obecném nastavení jde vypnout

## 0.15.0
- záložky: u rozbalené sekce oko přepíná vše, jen nepřečtené a jen přečtené, v obecném nastavení jde vypnout

## 0.14.12
- detail události má u ikon přátel odznak jdu nebo zajímá, v obecném nastavení jde vypnout

## 0.14.10
- účast na události jde přes `nyx-api` 0.5.2

## 0.14.9
- detail události má pod účastníky tlačítka jdu, zajímá mě a nejdu

## 0.14.8
- dialog účastníků má stejnou hlavičku a řádky jako detail hodnocení, pod řádky je barva D

## 0.14.7
- seznam událostí má + pro založení na webu, prohlížeč si pamatuje přihlášení

## 0.14.6
- detail události: datum a místo jsou vpravo na řádku s pořadatelem, popis začíná zvýrazněným názvem
- řádek v seznamu má nahoře tmavý okraj a místo konání je na vlastním řádku

## 0.14.5
- seznam a detail události ukazují ikony přátel, zbytek účastníků je „a N dalších“
- filtr událostí už nepřekrývá seznam, řádek otevře diskuzi

## 0.14.4
- detail události: počet účastníků je hned pod pořadatelem, oba řádky mají primary border
- po galerii se placeholder v diskuzi hned nahradí obrázkem

## 0.14.3
- detail události: pořadatel, čas, místo, popis, obrázky a pruh účastníků nad diskuzí
- řádek v seznamu událostí otevře diskuzi

## 0.14.2
- kalendář událostí jede za prstem a dá se v půlce vrátit
- hlavička filtru má stejný ripple a spring animaci jako hledání v diskuzi

## 0.14.1
- filtr událostí se otevírá hned, bez skládání všech měsíců
- posun měsíce nenačítá seznam znovu
- při otevřeném filtru patří vodorovný swipe kalendáři
- tlačítka filtru jsou hned pod výběry

## 0.14.0
- seznam událostí: tab s kalendářem, filtr a řazení, `nyx-api` 0.5.1

## 0.13.2
- fix: skok na nejstarší nepřečtený i když last_seen post už neexistuje

## 0.13.1
- fix: po otevření galerie se placeholder v diskuzi hned nahradí obrázkem

## 0.13.0
- nastavení stahování obrázků (vypnout / strop kB / neomezovat)
- cached obrázky se zobrazí rovnou i při vypnutém stahování / stropu kB
- Last / Reminders / Notifikace / Pošta používají stejné limity a prefetch obrázků jako diskuze
- galerie a placeholdery ukazují velikost (kB, nad 1 MB červeně tučně v MB)
- nastavitelná kvalita přikládaných jpeg při zmenšení (50–90 %, výchozí 75 %)
- šablony tučné a kurzíva v novém příspěvku
- nahrané video se vloží jako `<video>` tag

## 0.12.0
- `nyx-api` 0.3.2 (`last_seen_post_id` v bookmarks/historii)
- diskuze ze seznamu se otevře u prvního nepřečteného (1 stránka novějších + last_seen a starší), další novější pull-to-refresh

## 0.11.0
- hodnocení postu z galerie (thumbs up/down)
- po zavření galerie skok na poslední zobrazený post (bez animace)
- fix: fotky v galerii na celou obrazovku

## 0.10.10
- tlačítka po swipe hlavičky zase berou tap

## 0.10.9
- systémový Back zase prochází stacky a historii tabů

## 0.10.8
- sdílení obrázku z galerie na Androidu

## 0.10.7
- zpět swipe hlavičky postu (gesture-handler)

## 0.10.6
- ripple znovu oříznutý v bounds tlačítka

## 0.10.5
- galerie drží správný index po načtení dalších postů / dosažení konce diskuze

## 0.10.4
- compose dialog drží nad klávesnicí

## 0.10.3
- zpět ripple u tlačítek (TouchableRipple)

## 0.10.2
- menší splash logo (kruhová maska Android 12)
- loader při načítání obrázků v diskusi

## 0.10.0
- React Native 0.81, targetSdk 36, navigace v7
- hlavičky, FAB a insety pro Android 15+
- oprava nyx videí a YouTube náhledů
- přispěvatelé v About

## 0.9.0
- swipeovatelná hlavička postu
- oprava výpočtu výšky layoutu
