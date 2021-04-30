## another nyx client

### Klient pro Nyx.cz psany v React-Native, (prechodne nnn)

### [diskuze](https://nyx.cz/discussion/271373)

#### Chcete-li si appku zbuildit sami, budete potrebovat [par malickosti](https://reactnative.dev/docs/environment-setup) (React Native CLI quickstart)

Taky bude treba:

* [nainstalovat zavislosti](https://yarnpkg.com/getting-started/install): `yarn`

* v rootu projektu vytvorit `keys.json` s obsahem: `{ "bugfender": "<BUGFENDER_KEY>" }`

* zalozit [FCM](https://firebase.google.com/docs/cloud-messaging), pridat si appku do projektu a stahnout _google-services.json_ do _./android/app/_

* pripojit zarizeni s povolenym debug modem a authorizovat ho (potvrdit vyskocivsi prompt)

* spustit bundler: `npx react-native start --reset-cache`

* ve druhem terminalu spustit build: `npx react-native run-android`

* pripadne vytvorit a pridat signing cert (do _./android/app/nnn-signing.keystore_) a spustit release build: `npx react-native run-android --variant=release`
