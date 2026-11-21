# Up Up & Away! - Android (APK / AAB)

The exact web game, as a mobile app. This is **not a remake**: the app runs your
real web build from
`https://up-up-and-away.up-up-and-away-server.workers.dev/`
in a fullscreen WebView, so the tower, zones, bots, locker, saves, private
rooms and voice chat are 1:1 the same - and every web update you ship is
instantly in the app too.

What the wrapper adds (the only new code):

1. **Touch controls** (`app/src/main/assets/touch-controls.js`, injected on
   page load). Built from your game's own input code (`js/main.js`, class
   `Input`). It drives `GAME.input` directly:
   - Left virtual joystick -> `KeyW/A/S/D`
   - Drag on the right half of the screen -> `input.mdx/mdy` (camera)
   - Buttons -> the real key codes (see map below)
   - Pointer-lock patch: Android WebView has no pointer lock, so the wrapper
     neutralises `requestLock()` and keeps `input.locked = true` while
     playing. That hides the CLICK TO PLAY pill and enables weapon fire.
     Controls only appear while `GAME.state === 'play'`. Menus, Locker,
     Stats and the multiplayer screens use normal taps.
2. **Microphone permission flow** for voice chat (`getUserMedia` ->
   Android `RECORD_AUDIO`).
3. **Invite links**: opening an `https://...workers.dev/?room=CODE` link
   with the app installed offers the app, and the room code is passed
   straight through. Inside the app, the game auto-joins `?room=` links
   exactly like the web version.

## Touch control map

| Touch | Game input | Action |
|---|---|---|
| Left joystick | WASD | Move |
| Drag right side | Mouse move | Camera |
| JUMP (hold) | Space | Jump / parachute, hold to pull up from a ledge |
| DIVE | E | Dive lunge |
| ACT | F | Interact / piggyback / sit / carts |
| ROPE | X | Friendship rope |
| GUN | G | Draw / holster weapon |
| FIRE (hold) | Left click | Fire weapon (auto weapons keep firing held) |
| AIM (hold) | Right click | Over-the-shoulder aim |
| SWAP | C | Swap weapon |
| POGO | B | Pogo stick |
| CART | N | Summon cart |
| + / - | Mouse wheel | Camera zoom (all the way in = first person) |
| CAM | Z | First person toggle |
| EMOTE | 1 | Emote slot 1 |
| CHAT | T | Open chat (in a private room) |
| MIC | V | Voice mute toggle |
| II (top right) | P | Pause |

## Build the APK / AAB

Gradle cannot run on Glint's VM (its daemon channel dies in the sandbox -
re-verified 2026-11-21 with a local JDK 17 + Gradle 8.11.1), so no binaries
are bundled. Two working routes:

### Route A - Android Studio on your PC (fastest)
1. Unzip, open the folder in Android Studio.
2. Let it sync (it downloads Gradle 8.11.1 + AGP 8.7.3 itself).
3. **APK (test on a phone):** Build > Build App Bundle(s) / APK(s) > Build APK(s).
   Output: `app/build/outputs/apk/debug/app-debug.apk`
4. **AAB (Play Store):** Build > Generate Signed App Bundle / APK >
   Android App Bundle. Create your keystore there **once**, back it up
   somewhere safe and offline - if you lose it you can never update the app.
   Never send the keystore or its passwords to anyone, including in chat.

### Route B - GitHub Actions (no local build)
1. Push this folder to a GitHub repo.
2. Actions tab > "Build Android (APK + AAB)" > Run workflow.
3. Download the `up-up-and-away-debug-apk` artifact.
4. For a signed release AAB, add repo secrets `RELEASE_KEYSTORE_B64`
   (base64 of your keystore), `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`,
   `RELEASE_KEY_PASSWORD` and re-run - the `up-up-and-away-release-aab`
   artifact appears.

## Notes / limits

- **Internet required** - same as the web game (Three.js CDN + your server).
- Saves live in the WebView's localStorage on the phone. Uninstalling the
  app clears them, same as clearing browser data does on web.
- Performance = phone GPU. If a phone struggles, set Quality to Low in the
  game's own Settings (it drops pixel ratio, shadows and bot count).
- App id: `com.syedali.upupandaway`, version 1.0.0 (code 1), min Android 7.0.
- To make a specific room the default, change `BASE_URL` in
  `MainActivity.kt` to the full invite URL (e.g. `.../?room=YOURCODE`).
