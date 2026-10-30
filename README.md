# Revenant's Toll

A roguelite survival game in the style of Halls of Torment. Hold the halls against an endless horde, level up, loot gear, and slay the final boss before the halls collapse.

**Play:** open the GitHub Pages link for this repo in a desktop browser. An Xbox controller is supported; keyboard works too.
https://ncstateguy.github.io/revenants-toll/

## Controls
- Move: left stick / WASD
- Dodge: LB or RB / Shift
- Ultimate: X or RT / Space
- Pause: Menu / Esc

## Heroes
Start as one of four basic heroes (Fighter, Apprentice, Scout, Wildling). Complete challenges to unlock their advanced forms. Your progress saves in your browser.

## Playing online
On the hero select screen, choose **Sign in with Google** or **Play as guest** to join the weekly leaderboard, meet your friends' Revenants and receive gifts. Google sign-in keeps your progress on any computer. Guest progress stays in that browser, and a guest can link a Google account later without losing anything. You can also skip both and play offline.

## For the maintainer
- `index.html` is built from the game source with `./build.sh path/to/game.html`.
- `cloud.js` and `cloud-adapter.js` connect the game to Firebase (project `revenant-s-toll`).
- `firestore.rules` holds the database security rules. Paste them into Firebase > Firestore > Rules.
