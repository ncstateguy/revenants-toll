// Online features for the GitHub Pages build: Google sign-in or a guest name,
// cloud saves, weekly leaderboard, friends' Revenants and gifts (Firebase).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, linkWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { makeAdapter } from './cloud-adapter.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAcu0uz25wyUHZwS-hBfbJyRJPxjtU8fpI',
  authDomain: 'revenant-s-toll.firebaseapp.com',
  projectId: 'revenant-s-toll',
  storageBucket: 'revenant-s-toll.firebasestorage.app',
  messagingSenderId: '887331606833',
  appId: '1:887331606833:web:0ac0b88000fe7669036010',
};

const GUEST_KEY = 'revenantsToll.guestName';
const getGuestName = () => { try { return localStorage.getItem(GUEST_KEY); } catch (e) { return null; } };
const setGuestName = n => { try { localStorage.setItem(GUEST_KEY, n); } catch (e) { /* private mode */ } };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fsdb = getFirestore(app);
const { db, user } = makeAdapter({ doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, addDoc }, fsdb, () => auth.currentUser, getGuestName);

window.CLOUD_LABEL = 'Saved to your online account';
window.CLOUD_HINT = 'Sign in with Google or play as a guest to see the leaderboard.';

// ---------- account panel (shown on the hero select screen) ----------
const css = document.createElement('style');
css.textContent = `
#acct{position:fixed;bottom:12px;right:12px;z-index:10;display:flex;flex-direction:column;align-items:flex-end;gap:6px;max-width:min(300px,calc(100vw - 24px));
  font-family:var(--f-body,system-ui);color:var(--bone,#ece2cc);background:rgba(18,15,21,.92);border:1px solid #3b3341;border-radius:8px;padding:10px 12px;text-align:right}
#acct p{margin:0;font-size:13px;line-height:1.35;color:#a097a6}
#acct b{color:#e3bd5d}
#acct .row{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
#acct button{appearance:none;font:inherit;font-size:13px;font-weight:700;cursor:pointer;color:#ece2cc;background:#241e29;border:1px solid #3b3341;border-radius:999px;padding:6px 12px}
#acct button:hover,#acct button:focus-visible{border-color:#e3bd5d;outline:none}
#acct button.main{background:#e3bd5d;color:#0b0a0d;border-color:#e3bd5d}
#acct input{font:inherit;font-size:13px;padding:6px 10px;border-radius:999px;border:1px solid #3b3341;background:#100e12;color:#ece2cc;width:150px}
#acct .err{color:#ff7a6a}`;
document.head.appendChild(css);
const panel = document.createElement('div');
panel.id = 'acct';
document.body.appendChild(panel);
let mode = 'idle', errMsg = '';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nameShown = u => u.isAnonymous ? (getGuestName() || 'Guest') + ' (guest)' : ((u.displayName || 'Player').split(/\s+/)[0]);

function draw() {
  const u = auth.currentUser;
  const err = errMsg ? `<p class="err">${esc(errMsg)}</p>` : '';
  if (u) {
    panel.innerHTML = `<p>Playing online as <b>${esc(nameShown(u))}</b></p>
      ${u.isAnonymous ? '<p>Guest progress lives in this browser. Link Google to keep it on any computer.</p>' : ''}
      <div class="row">${u.isAnonymous ? '<button data-a="link">Link Google</button>' : ''}<button data-a="out">Sign out</button></div>${err}`;
  } else if (mode === 'guest') {
    panel.innerHTML = `<p>Pick a name for the leaderboard</p>
      <div class="row"><input id="gname" maxlength="20" placeholder="Your name" value="${esc(getGuestName() || '')}"><button class="main" data-a="join">Join</button><button data-a="cancel">Back</button></div>${err}`;
    const inp = panel.querySelector('#gname');
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') act('join'); });
    inp.addEventListener('keyup', e => e.stopPropagation());
    setTimeout(() => inp.focus(), 0);
  } else {
    panel.innerHTML = `<p>Play online for the leaderboard, friends' Revenants and gifts</p>
      <div class="row"><button class="main" data-a="google">Sign in with Google</button><button data-a="guest">Play as guest</button></div>
      <p>Or just pick a hero. Progress saves in this browser.</p>${err}`;
  }
}
async function act(a) {
  errMsg = '';
  try {
    if (a === 'google') await signInWithPopup(auth, new GoogleAuthProvider());
    else if (a === 'guest') { mode = 'guest'; draw(); }
    else if (a === 'cancel') { mode = 'idle'; draw(); }
    else if (a === 'join') {
      const n = (panel.querySelector('#gname').value || '').trim().replace(/[<>]/g, '').slice(0, 20);
      if (!n) { errMsg = 'Type a name first.'; draw(); return; }
      setGuestName(n);
      await signInAnonymously(auth);
    } else if (a === 'link') { await linkWithPopup(auth.currentUser, new GoogleAuthProvider()); await db.doc('players/' + auth.currentUser.uid).set({ t: Date.now() }); draw(); }
    else if (a === 'out') { await signOut(auth); location.reload(); }
  } catch (e) {
    const c = (e && e.code) || '';
    errMsg = c.includes('popup-closed') || c.includes('cancelled-popup') ? '' :
      c.includes('credential-already-in-use') ? 'That Google account already has its own save. Sign out, then sign in with Google.' :
      c.includes('unauthorized-domain') ? 'This site is not yet allowed to sign in. The game owner needs to add it in Firebase.' :
      c.includes('operation-not-allowed') ? 'That sign-in option is turned off in Firebase.' : 'Could not sign in. Try again.';
    draw();
  }
}
panel.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (b) { e.stopPropagation(); act(b.dataset.a); } });

// Show the panel only on the hero select screen.
setInterval(() => { panel.style.display = document.querySelector('#overlay:not([hidden]) .screen.select') ? 'flex' : 'none'; }, 300);

let started = false;
onAuthStateChanged(auth, u => {
  mode = 'idle';
  draw();
  if (u) {
    window.claude = { use: async k => (k === 'db' ? db : k === 'user' ? user : null) };
    if (!started && window.__initCloud) { started = true; window.__initCloud(); }
  }
});
