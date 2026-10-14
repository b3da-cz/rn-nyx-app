# Integrace nyx-api

Srovnání appu s `nyx-api` **0.5.2** (`NyxApi` v `node_modules/nyx-api/src/NyxApi.ts`). App volá **35 ze 44 metod**, tedy **79,5 %**. **9 metod (20,5 %)** se nevolá vůbec. Tři volané metody mají ještě nevyužitou větev.

`logout()` není vlastní HTTP endpoint. Jen smaže token přes `deleteAuthToken` a vyvolá `onLogout`. Obojí app používá.

| Metoda | HTTP | App |
|---|---|---|
| `createAuthToken` | `POST create_token/{user}` | ano, přihlášení |
| `deleteAuthToken` | `POST delete_token/{token}` | ano, odhlášení |
| `logout` | jen klientsky nad `deleteAuthToken` | ano |
| `getContext` | `GET status` | ano, profil a refresh kontextu |
| `getBookmarks` | `GET bookmarks` a `bookmarks/all` | ano, obě větve |
| `getHistory` | `GET bookmarks/history` | částečně, `show_read` ano, `show_booked` ne |
| `getLastPosts` | `GET last`, `/min_rating/`, `/rated_by_friends`, `/rated_by_me` | částečně, chybí `rated_by_me` |
| `getLastDiscussions` | `GET last/discussions` | ne |
| `search` | `GET search`, `/unified`, `/username/{phrase}` | částečně, unified a username; holé `search?search=` ne |
| `searchV2` | `GET search-v2` | ne |
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
| `deleteDiscussionRights` | `DELETE discussion/rights` | ne |
| `saveDiscussionContent` | `POST discussion/{id}/content/{contentId}/save` | ne |
| `getMail` | `GET mail` | ano, seznam, konverzace, starší zprávy |
| `sendPrivateMessage` | `POST mail/send` | ano |
| `sendTypingNotification` | `POST mail/typing_notification/{user}` | ano |
| `getWaitingFiles` | `GET mail/waiting_files` a `discussion/{id}/waiting_files` | ano |
| `uploadFile` / `deleteFile` | `PUT file/upload`, `DELETE file/delete/{id}` | ano, pošta i diskuze |
| `setFileEmbed` | `POST file/embed/{id}/{bool}` | ne |
| `getReminders` | `GET bookmarks/reminders` a `mail/reminders` | ano, obě |
| `getNotifications` | `GET notifications` | ano |
| `subscribeForFCM` | `POST register_for_notifications/…` | ano |
| `unregisterFromFCM` | `POST deregister_notifications/{token}/{app}/{fcm}` | volá se, ale jen s jedním argumentem, `appIdentifier` chybí |
| `getNotepad` | `GET notepad` | ne |
| `getNotepadEntry` | `GET notepad/{id}` | ne |
| `removeBookmarksFromHistory` | `POST bookmarks/history/remove_from_history` | ne |
| `markBookmarksHistoryAsRead` | `POST bookmarks/history/mark_as_read` | ne |
| `getEvents` | `GET events` | ano, navíc `order`, `epoch`, `search` přes `NyxEventsApi` |
| `setEventAttendance` | `POST event/{id}/attendance/{going\|interested\|none}` | ano |

## Co v app ještě není

Devět metod, které se nevolají:

- **Zápisník.** `getNotepad` a `getNotepadEntry` umí jen číst seznam a detail. Balíček nemá zápis ani úpravu.
- **Fulltext příspěvků.** `searchV2` (`user`, `text`, `order` `newest` / `newer_than` / `older_than` / `oldest`, `from_id`). Vyhledávání v app je unified (diskuze, inzeráty, události, uživatelé) a našeptávání username. Větev `GET search?search=` se také nevolá.
- **Poslední diskuze.** `GET last/discussions`. Tab „poslední“ bere jen příspěvky.
- **Historie hromadně.** Vyřadit diskuze z historie a označit je jako přečtené. Seznam historie app má, tyto dvě akce ne. Parametr `show_booked` se neposílá.
- **Odebrání práva.** Přidat uživatele a přepnout právo jde. `deleteDiscussionRights` ne. Seznam práv není v balíčku. App ho bere jako HTML z `/discussion/{id}/rights`.
- **Uložení nástěnky.** `saveDiscussionContent`. Čtení `content/home` je zapojené, zápis ne.
- **Embed souboru.** `setFileEmbed` přepíná vložení souboru do příspěvku.
- **Filtr posledních příspěvků „hodnoceno mnou“.** `getLastPosts(..., isRatedByMe)` a cesta `/rated_by_me`. Minimum a „hodnotili přátelé“ app používá.

Mimo balíček app navíc volá `DELETE mail/delete/{postId}` a HTML stránku práv. Založení události není API metoda. Je to WebView na `https://nyx.cz/event/create`.

Hlasování o novém klubu v balíčku není. Post typu `discussion_request` se dnes vykreslí jako HTML tabulka ve WebView (`DiscussionRequestComponent`). Parser v `parseDiscussionRequest` řádky s `vote_for` / `vote_against` z HTML vyřízne a kliky ve WebView spolkne.

## Plán integrace

1. **Odebrání práv.** Na dialogu detailu práv (`RightsDialog` v `DiscussionRightsComponent`) přidat odebrání uživatele přes `deleteDiscussionRights`. Tlačítko ve stylu `DoubleTapDeleteButton`: první krok má text, ne jen ikonu. Druhý krok nechat jen checkmark. Po potvrzení smazat řádek a zavřít dialog.
2. **Embed souboru.** Na konec řádku nahraného souboru v compose dialogu (`MessageBoxDialog`, seznam `uploadedFiles`) přidat přepínač a volat `setFileEmbed`. Výchozí stav je současné chování: vložit jako obrázek, ne jako odkaz na soubor. Dialog si volbu nepamatuje. Každý soubor začíná jako obrázek a před odesláním se přepíná zvlášť.
3. **Filtr „hodnoceno mnou“.** Do řádku filtru posledních příspěvků (`RatingFilterBarComponent`, vedle ikony `users`) přidat ikonu uživatele. Zapnutý filtr posílá třetí argument `getLastPosts` (`/rated_by_me`).
4. **Zápisník.** Obrazovka nad `getNotepad` a `getNotepadEntry`: seznam a detail. Balíček umí jen čtení, zápis do té doby nepřidávat.
5. **Hlasování o novém klubu.** U postu `discussion_request` nahradit HTML tabulku nativním zobrazením ve stylu ankety v app (tlačítka pro a proti, ne WebView). V `nyx-api` 0.5.2 na to endpoint není. Hlas posílat jako běžný příspěvek přes `postToDiscussion`, až se při implementaci ověří text, který web po `vote_for` / `vote_against` skutečně odešle. Když se ukáže samostatná cesta, použít tu.
6. **Zbytek nechat jako TODO**, až po zápisníku:
   - fulltext `searchV2` a nevyužitá větev `GET search?search=`
   - poslední diskuze `getLastDiscussions`
   - historie: `removeBookmarksFromHistory`, `markBookmarksHistoryAsRead`, parametr `show_booked`
   - uložení nástěnky `saveDiscussionContent`
   - `unregisterFromFCM` doplnit o `appIdentifier` (teď se volá jen s tokenem)
