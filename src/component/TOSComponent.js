import React from 'react'
import { BackHandler, Text, View, ScrollView } from 'react-native'
import { name as appName } from '../../app.json'
import { ButtonComponent } from '../component'
import { Styling, t } from '../lib'

export const TOSComponent = ({ isDarkMode, onConfirm }) => {
  return (
    <ScrollView style={Styling.groups.themeView(isDarkMode)}>
      <View style={[Styling.groups.themeView(isDarkMode), { flex: 1, padding: Styling.metrics.block.medium }]}>
        <Text
          style={{
            color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
            fontSize: Styling.metrics.fontSize.xlarge,
            marginBottom: Styling.metrics.block.medium,
          }}>
          Podmínky využívání aplikace {appName}
        </Text>
        <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>
          {`Autor aplikace nenese odpovědnost za jakékoliv škody vzniklé jejím užíváním, chybnou funkcí, případně nefunkčností.\n
Uživatel se zavazuje dodržovat podmínky využívání serveru nyx.cz (viz. níže).\n
Uživatel bere na vědomí, že aplikace odesílá chybová hlášení na server třetí strany (bugfender.com). Hlášení neobsahují citlivé informace.\n
V případě nežádoucího obsahu vytvářeného uživateli je možné jeho nahlášení provozovateli pomocí tlačítka s vykřičníkem u příspěvku.\n`}
        </Text>
        <Text
          style={{
            color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
            fontSize: Styling.metrics.fontSize.xlarge,
            marginTop: Styling.metrics.block.xlarge,
          }}>
          Podmínky využívání serveru nyx.cz
        </Text>
        <Text
          style={{
            color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
            fontSize: Styling.metrics.fontSize.large,
            marginTop: Styling.metrics.block.medium,
          }}>
          Základní pravidla
        </Text>
        <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>
          {`Provozovatel nenese odpovědnost za jakékoliv škody vzniklé užíváním služby, její chybnou funkcí, případně nefunkčností.\n
Provozovatel a osoby jím pověřené mohou kdykoliv kterémukoliv uživateli zrušit nebo omezit přístup ke službě bez udání důvodu. Mohou též kontrolovat a vymáhat dodržování pravidel užívání služby a používat k tomu všech jim dostupných prostředků v rámci jim svěřených pravomocí.\n
Půjčování, případně odstoupení účtu, vytváření si více účtů pro vlastní potřebu a vytváření společných účtů je možné pouze po předchozí domluvě s administrátory.\n
Nevyužívejte bezpečnostních děr systému, serveru, na kterém je systém provozován, ani obecných děr v protokolech, které systém využívá pro svůj provoz. Pokud se dozvíte o existenci nějaké bezpečnostní chyby, případně o zneužívání bezpečnostních chyb jiným uživatelem, nahlašte, prosím, tuto skutečnost správci systému, případně některému z administrátorů serveru. Nešiřte informaci o chybě dále, dokud tato nebude odstraněna.\n
Provozovatel si vyhrazuje právo na změnu těchto podmínek, na kterou vždy minimálně týden předem upozorní.`}
        </Text>
        <Text
          style={{
            color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
            fontSize: Styling.metrics.fontSize.large,
            marginTop: Styling.metrics.block.medium,
          }}>
          Slušné chování
        </Text>
        <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>
          {`Neobtěžuj svým chováním ostatní.\n
Kopíruješ-li cizí příspěvky do jiných klubů, nedělej tak, je-li zřejmé, že by to mohlo jejich autorovi vadit nebo pokud s tím on sám nesouhlasí. Pokud si nejsi jistý, zeptej se ho – vyhneš se tak nedorozumění. Pokud se jedná o příspěvky z privátních klubů, zeptej se ho vždy – od toho jsou ty kluby privátní. Pokud cizí příspěvek kopíruješ/cituješ, není na škodu uvést odkaz na původní příspěvek, kde je vidět kontext. Pokud citovaný text podléhá autorskému zákonu, zákon tímto aktem nesmí být porušen.\n
Šetři časem ostatních a nerozesílej stejnou zprávu do různých klubů, drž se tématu klubu a měj ohled na ostatní, kteří jsou nuceni číst tvou zprávu vícekrát v různých klubech. Snaž se napsat vše podstatné v klubu do jedné zprávy. Stejně tak šetři poštu ostatních a nezasílej nevyžádané zprávy.\n
Neurážej ostatní a nechovej se zbytečně vulgárně. Respektuj upozornění od ostatních uživatelů, pokud toto nedodržíš.\n
Prosím, nepoužívej veřejně symboly, které jsou obvykle spojovány s hnutími, která směřují k potlačení práv a svobod člověka. Zejména se vyvaruj užívání symbolů v té formě, ve které byly nějakým takovým hnutím v minulosti zneužívány, a mohou být proto vnímány jako provokující.`}
        </Text>
        <Text
          style={{
            color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
            fontSize: Styling.metrics.fontSize.large,
            marginTop: Styling.metrics.block.medium,
          }}>
          Správa diskuzí
        </Text>
        <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>
          {`V případě, že dojde v diskuzi k porušení těchto pravidel, která dle mínění správce diskuse nevyřešili uživatelé sami, je povinností správce diskuze zjednat pořádek pomocí domluvy, případně smazáním příspěvků a v případě nutnosti omezením zápisu či vstupu pro inkriminované uživatele. K tomuto účelu může správce diskuze přidělit práva jiným uživatelům, sám však nese plnou odpovědnost za dění v diskuzi. Snažte se udržovat své diskuse s ohledem na jejich odbornost na co nejvyšší úrovni, spravujte je důsledně, ale poctivě. Neomezujte pluralitu názorů. Neporušujte zákony ČR ani jiné země, odkud pocházíte či píšete. Pokud bude tento bod přes upozornění správce sekce nebo varování administrátora dlouhodobě závažně porušován, bude aplikováno právo administrátorů na změnu správce diskuze.\n
Administrátoři serveru mohou ve výjimečných případech změnit majitele či spolusprávce veřejných diskuzí, u kterých to uznají za vhodné – zejména v případě, že se o ně majitel či spolusprávci nestarají, případně je jejich chování v rozporu s posláním serveru.`}
        </Text>
        <Text
          style={{
            color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
            fontSize: Styling.metrics.fontSize.large,
            marginTop: Styling.metrics.block.medium,
          }}>
          Cookies
        </Text>
        <Text style={{ color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker }}>
          Web používá cookies pro evidenci přihlášení, případně pro Google Adsense v případě, že nemáte vypnuté reklamy.
        </Text>
        <View style={Styling.groups.flexRowSpbCentered}>
          <ButtonComponent
            label={t('exit')}
            isDarkMode={isDarkMode}
            width={'50%'}
            onPress={() => BackHandler.exitApp()}
          />
          <ButtonComponent label={t('agree')} isDarkMode={isDarkMode} width={'50%'} onPress={() => onConfirm()} />
        </View>
      </View>
    </ScrollView>
  )
}
