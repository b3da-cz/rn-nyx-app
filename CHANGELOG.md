# Changelog

## Unreleased

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
