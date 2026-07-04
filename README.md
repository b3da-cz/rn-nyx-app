## another nyx client

### Klient pro Nyx.cz psany v React-Native, (prechodne nnn)

### [diskuze](https://nyx.cz/discussion/271373), [nyx-api.js](https://github.com/b3da-cz/nyx-api)

Stack: React Native 0.81 (Legacy Architecture), react-navigation 7, targetSdk 36 (Android 16).

#### Chcete-li si appku zbuildit sami, budete potrebovat [par malickosti](https://reactnative.dev/docs/environment-setup) (React Native CLI quickstart)

Konkretne:

* Node.js 20+, JDK 17+, Android SDK (platform 36)

Taky bude treba:

* nainstalovat zavislosti: `npm install` (pouziva se npm, ne yarn; postinstall automaticky aplikuje opravy starsich nativnich modulu z `patches/`)

* v rootu projektu vytvorit `keys.json` s obsahem:

  ```json
  {
    "bugfender": "<BUGFENDER_KEY>",
    "gplayTestId": "",
    "gplayTestToken": ""
  }
  ```

  (vsechny klice muzou zustat prazdne - bez Bugfender klice se logovani jen preskoci)

* zalozit [FCM](https://firebase.google.com/docs/cloud-messaging), pridat si appku do projektu a stahnout _google-services.json_ do _./android/app/_ (bez nej se appka zbuildi jen s placeholder souborem, ale nebudou fungovat push notifikace)

* pripojit zarizeni s povolenym debug modem a authorizovat ho (potvrdit vyskocivsi prompt); u fyzickeho zarizeni pres USB jeste `adb reverse tcp:8081 tcp:8081`

* spustit bundler: `npx react-native start`

* ve druhem terminalu spustit build: `npx react-native run-android`

#### Release build

* podepisovani se konfiguruje pres gradle properties `NNN_UPLOAD_STORE_FILE`, `NNN_UPLOAD_STORE_PASSWORD`, `NNN_UPLOAD_KEY_ALIAS` a `NNN_UPLOAD_KEY_PASSWORD` (typicky v `~/.gradle/gradle.properties`)

* release APK: `npm run release-apk`

* App Bundle pro Google Play: `npm run release-aab` (vysledek v _./android/app/build/outputs/bundle/release/_)

* verze appky se bere z `package.json`: `version` (versionName) a `buildVersion` (versionCode - pred uploadem na Play je treba zvednout)

#### Poznamky k udrzbe

* `vendor/react-native-notification-banner` je vendorovana (upstream je mrtvy) - opravena pro AGP 8 a Alerter 7, prepsana do Kotlinu

* `react-native-image-helper` vypada nepouzite, ale notification-banner ho nacita pres reflexi (ikony v banneru) - neodstranovat

* zavislosti jsou zamerne pinnute na verze kompatibilni s RN 0.81 a Legacy Architecture (novejsi major verze vetsinou vyzaduji New Architecture)
