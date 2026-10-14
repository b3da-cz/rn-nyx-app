# Changelog

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
