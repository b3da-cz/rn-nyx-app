# Integrace nyx-api

Srovnání appu s `nyx-api` **0.5.2** (`NyxApi` v `node_modules/nyx-api/src/NyxApi.ts`). App volá **40 ze 44 metod**, tedy **90,9 %**. **4 metody** se nevolají vůbec: `getLastDiscussions`, `removeBookmarksFromHistory`, `markBookmarksHistoryAsRead`, `saveDiscussionContent`. `getHistory` pořád neposílá `show_booked`.

`logout()` není vlastní HTTP endpoint. Jen smaže token přes `deleteAuthToken` a vyvolá `onLogout`. Obojí app používá.

| Metoda | HTTP | App |
|---|---|---|
| `createAuthToken` | `POST create_token/{user}` | ano, přihlášení |
| `deleteAuthToken` | `POST delete_token/{token}` | ano, odhlášení |
| `logout` | jen klientsky nad `deleteAuthToken` | ano |
| `getContext` | `GET status` | ano, profil a refresh kontextu |
| `getBookmarks` | `GET bookmarks` a `bookmarks/all` | ano, obě větve |
| `getHistory` | `GET bookmarks/history` | částečně, `show_read` ano, `show_booked` ne |
| `getLastPosts` | `GET last`, `/min_rating/`, `/rated_by_friends`, query `rated_by_me` | ano, `rated_by_me` jde jako query, cesta `/rated_by_me` vrací 404 |
| `getLastDiscussions` | `GET last/discussions` | ne |
| `search` | `GET search`, `/unified`, `/username/{phrase}` | ano, unified, username i holé `search?search=` |
| `searchV2` | `GET search-v2` | ano, fulltext příspěvků |
| `getDiscussion` | `GET discussion/{id}` | ano, včetně stránkování a replies v path |
| `getDiscussionBoard` | `GET discussion/{id}/content/home` | ano, nástěnka |
| `getDiscussionStats` | `GET discussion/{id}/stats` | ano |
| `bookmarkDiscussion` | `POST discussion/{id}/bookmark` | ano |
| `postToDiscussion` | `POST discussion/{id}/send/text` | ano |
| `deletePost` | `DELETE discussion/{id}/delete/{postId}` | ano |
| `getRating` / `ratePost` | `GET/POST discussion/{id}/rating/{postId}/…` | ano, včetně `positive`, `negative`, `negative_visible`, `remove` |
| `setReminder` | `POST discussion/…/reminder` a `mail/reminder` | ano, obě |
| `reportPost` | `POST report/{postId}` | ano |
| `rollDice` / `rollDiceInHeader` | `POST …/dice/…/roll` | ano |
| `voteInPoll` / `voteInHeaderPoll` | `POST …/poll/…/vote` | ano |
| `addDiscussionRights` | `POST discussion/rights/add` | ano |
| `setDiscussionRight` | `POST discussion/rights` | ano |
| `deleteDiscussionRights` | `DELETE discussion/rights` | ano, odebrání uživatele v dialogu práv |
| `saveDiscussionContent` | `POST discussion/{id}/content/{contentId}/save` | ne |
| `getMail` | `GET mail` | ano, seznam, konverzace, starší zprávy |
| `sendPrivateMessage` | `POST mail/send` | ano |
| `sendTypingNotification` | `POST mail/typing_notification/{user}` | ano |
| `getWaitingFiles` | `GET mail/waiting_files` a `discussion/{id}/waiting_files` | ano |
| `uploadFile` / `deleteFile` | `PUT file/upload`, `DELETE file/delete/{id}` | ano, pošta i diskuze |
| `setFileEmbed` | `POST file/embed/{id}/{bool}` | ano, přepínač na řádku nahraného souboru |
| `getReminders` | `GET bookmarks/reminders` a `mail/reminders` | ano, obě |
| `getNotifications` | `GET notifications` | ano |
| `subscribeForFCM` | `POST register_for_notifications/…` | ano |
| `unregisterFromFCM` | `POST deregister_notifications/{token}/{app}/{fcm}` | ano, `appIdentifier` je `Nnn`, stejně jako u přihlášení |
| `getNotepad` | `GET notepad` | ano, seznam zápisníku |
| `getNotepadEntry` | `GET notepad/{id}` | ano, detail záznamu |
| `removeBookmarksFromHistory` | `POST bookmarks/history/remove_from_history` | ne |
| `markBookmarksHistoryAsRead` | `POST bookmarks/history/mark_as_read` | ne |
| `getEvents` | `GET events` | ano, navíc `order`, `epoch`, `search` přes `NyxEventsApi` |
| `setEventAttendance` | `POST event/{id}/attendance/{going\|interested\|none}` | ano |

## Co v app ještě není

Čtyři metody, které se nevolají:

- **Poslední diskuze.** `GET last/discussions`. Tab „poslední“ bere jen příspěvky.
- **Historie hromadně.** Vyřadit diskuze z historie a označit je jako přečtené. Seznam historie app má, tyto dvě akce ne. Parametr `show_booked` se neposílá.
- **Uložení nástěnky.** `saveDiscussionContent`. Čtení `content/home` je zapojené, zápis ne.

Mimo balíček app navíc volá `DELETE mail/delete/{postId}` a HTML stránku práv. Založení události není API metoda. Je to WebView na `https://nyx.cz/event/create`.

Hlasování o novém klubu v `nyx-api` 0.5.2 není. App ho volá z `NyxEventsApi.voteDiscussionRequest`: `POST discussion/{discussionId}/discussion_create_request/{postId}/vote_for` nebo `vote_against`. Odpověď je aktualizovaný příspěvek.

## Plán integrace

1. **Odebrání práv.** Hotovo ve v0.23.3. Na dialogu detailu práv (`RightsDialog` v `DiscussionRightsComponent`) jde odebrat uživatele přes `deleteDiscussionRights`. Tlačítko ve stylu `DoubleTapDeleteButton`: první krok má text, ne jen ikonu. Druhý krok je jen checkmark. Po potvrzení se řádek smaže a dialog zavře.
2. **Embed souboru.** Hotovo ve v0.25.1. Na konci řádku nahraného souboru v compose dialogu (`MessageBoxDialog`, seznam `uploadedFiles`, panel detailů) je přepínač a volá `setFileEmbed`. Výchozí stav je současné chování: vložit jako obrázek, ne jako odkaz na soubor. Dialog si volbu nepamatuje. Každý soubor začíná jako obrázek a před odesláním se přepíná zvlášť. Zapnutý stav je ikona obrázku, vypnutý ikona odkazu.
3. **Filtr „hodnoceno mnou“.** Hotovo. V řádku filtru posledních příspěvků (`RatingFilterBarComponent`, vedle ikony `users`) je ikona uživatele. Zapnutý filtr volá `GET last?rated_by_me=true`. Cesta `/rated_by_me` z `nyx-api` 0.5.2 vrací 404, proto ji app obchází v `NyxEventsApi`. Kombinace nejdou. Přátelé mají přednost před hodnoceno mnou a to má přednost před minimem. Klepnutí na jednu volbu ostatní vypne. Samotné minimum a přátelé dál jdou cestou, která funguje.
4. **Zápisník.** Hotovo. Ikona v řadě akcí profilu. Seznam je `getNotepad`, detail `getNotepadEntry`. Swagger ani `nyx-api` 0.5.2 nemají zápis, proto nový záznam a úprava otevírají web `https://nyx.cz/notepad/create` a `https://nyx.cz/notepad/{id}/edit`.
5. **Hlasování o novém klubu.** Hotovo. Post `discussion_request` je nativní blok (`DiscussionRequestComponent`): název, kategorie, popis, podobné kluby a tlačítka Hlas pro / Hlas proti. WebView tabulka je pryč. Hlas jde přes `NyxEventsApi.voteDiscussionRequest`, ne přes `postToDiscussion`. Cesta je stejná jako na webu a ve Fyx: `POST discussion/{id}/discussion_create_request/{postId}/vote_for|vote_against`. Tlačítka zmizí, když `can_vote` je false, žádost je zrušená, nebo už má `discussion_id`. Počet hlasů je `computed_values.voters_positive_total` a `voters_negative_total`.
6. **Zbytek nechat jako TODO**, až po zápisníku:
   - poslední diskuze `getLastDiscussions`
   - historie: `removeBookmarksFromHistory`, `markBookmarksHistoryAsRead`, parametr `show_booked`
   - uložení nástěnky `saveDiscussionContent`

Hledání má přepínač: vše, kluby, inzeráty, události, uživatelé a příspěvky. Příspěvky jdou přes `searchV2` a první stránka navíc přes `GET search?search=`. Další stránka je `older_than`. Odhlášení z FCM posílá `appIdentifier` `Nnn`.
