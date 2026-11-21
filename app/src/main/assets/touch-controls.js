// Up Up & Away! - mobile touch controls (injected by the Android wrapper)
// Built against the game's real input code (js/main.js, class Input):
//   Input.keys[code]   - held keys, read by down()
//   Input.pressed      - Set of codes hit this frame, read by hit(), cleared in endFrame()
//   Input.mdx / mdy    - mouse movement accumulated per frame, drives the camera
//   Input.mouseL       - held fire (auto weapons), Input.fire - one-frame fire press
//   Input.mouseR       - aim (over-the-shoulder)
//   Input.locked       - pointer-lock flag; on mobile there is no pointer lock,
//                        so we set it true to hide CLICK TO PLAY and enable firing.
(function () {
  if (window.__uuTouchInstalled) return;
  window.__uuTouchInstalled = true;

  function G() {
    try { if (typeof GAME !== 'undefined' && GAME && GAME.input) return GAME; } catch (e) {}
    return window.GAME && window.GAME.input ? window.GAME : null;
  }

  // ---------- keyboard fallback (if GAME is somehow unreachable) ----------
  function synthKey(type, code) {
    var e;
    try {
      e = new KeyboardEvent(type, { code: code, key: code, bubbles: true, cancelable: true });
    } catch (err) { return; }
    window.dispatchEvent(e);
  }

  function keyDown(code, tapOnly) {
    var g = G();
    if (g) {
      g.input.keys[code] = true;
      g.input.pressed.add(code);
    } else {
      synthKey('keydown', code);
    }
    if (tapOnly) {
      setTimeout(function () { keyUp(code); }, 90);
    }
  }
  function keyUp(code) {
    var g = G();
    if (g) { g.input.keys[code] = false; }
    else { synthKey('keyup', code); }
  }
  function tapKey(code) { keyDown(code, true); }

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '#clickToPlay{display:none !important}',
    '#uuTouch{position:fixed;inset:0;z-index:99990;pointer-events:none;display:none;font-family:sans-serif;-webkit-user-select:none;user-select:none;touch-action:none}',
    '#uuTouch.on{display:block}',
    '.uuBtn{position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;font-weight:700;border-radius:50%;background:rgba(42,22,90,.45);border:2px solid rgba(255,255,255,.55);text-shadow:0 1px 2px rgba(0,0,0,.6);touch-action:none}',
    '.uuBtn:active,.uuBtn.held{background:rgba(255,210,63,.65);color:#2a165a}',
    '.uuSmall{width:46px;height:46px;font-size:10px;border-radius:14px}',
    '#uuJoyBase{position:absolute;pointer-events:auto;width:128px;height:128px;border-radius:50%;background:rgba(42,22,90,.30);border:2px solid rgba(255,255,255,.4);touch-action:none}',
    '#uuJoyKnob{position:absolute;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(255,255,255,.8);left:36px;top:36px;pointer-events:none}',
    '#uuCam{position:absolute;right:0;top:0;width:55%;height:100%;pointer-events:auto;touch-action:none}'
  ].join('\n');
  document.head.appendChild(css);

  // ---------- DOM ----------
  var root = document.createElement('div');
  root.id = 'uuTouch';
  root.innerHTML =
    '<div id="uuCam"></div>' +
    '<div id="uuJoyBase"><div id="uuJoyKnob"></div></div>';
  document.body.appendChild(root);

  function makeBtn(label, style, onDown, onUp) {
    var b = document.createElement('div');
    b.className = 'uuBtn';
    b.textContent = label;
    b.style.cssText = style;
    function dn(e) {
      e.preventDefault(); e.stopPropagation();
      b.classList.add('held');
      onDown && onDown();
    }
    function up(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      b.classList.remove('held');
      onUp && onUp();
    }
    b.addEventListener('touchstart', dn, { passive: false });
    b.addEventListener('touchend', up, { passive: false });
    b.addEventListener('touchcancel', up, { passive: false });
    b.addEventListener('mousedown', dn);
    b.addEventListener('mouseup', up);
    root.appendChild(b);
    return b;
  }

  // Top row: small utility buttons
  var top = 'top:10px;';
  makeBtn('II', top + 'right:10px;', function () { tapKey('KeyP'); }).classList.add('uuSmall');
  makeBtn('CHAT', top + 'right:62px;', function () { tapKey('KeyT'); }).classList.add('uuSmall');
  makeBtn('MIC', top + 'right:114px;', function () { tapKey('KeyV'); }).classList.add('uuSmall');
  makeBtn('CAM', top + 'right:166px;', function () { tapKey('KeyZ'); }).classList.add('uuSmall');
  makeBtn('EMOTE', top + 'right:218px;', function () { tapKey('Digit1'); }).classList.add('uuSmall');

  // Right cluster: action buttons (bottom right, thumb reach)
  makeBtn('JUMP', 'right:24px;bottom:24px;width:92px;height:92px;font-size:16px;',
    function () { keyDown('Space'); }, function () { keyUp('Space'); });
  makeBtn('DIVE', 'right:128px;bottom:36px;width:68px;height:68px;font-size:13px;',
    function () { tapKey('KeyE'); });
  makeBtn('ACT', 'right:36px;bottom:128px;width:68px;height:68px;font-size:13px;',
    function () { tapKey('KeyF'); });
  makeBtn('ROPE', 'right:116px;bottom:116px;width:56px;height:56px;font-size:11px;',
    function () { tapKey('KeyX'); });
  makeBtn('GUN', 'right:184px;bottom:52px;width:56px;height:56px;font-size:11px;',
    function () { tapKey('KeyG'); });
  makeBtn('SWAP', 'right:196px;bottom:120px;width:48px;height:48px;font-size:10px;',
    function () { tapKey('KeyC'); });
  makeBtn('POGO', 'right:250px;bottom:44px;width:48px;height:48px;font-size:10px;',
    function () { tapKey('KeyB'); });
  makeBtn('CART', 'right:258px;bottom:104px;width:48px;height:48px;font-size:10px;',
    function () { tapKey('KeyN'); });

  // Fire / aim: hold buttons on the right edge
  makeBtn('FIRE', 'right:24px;bottom:210px;width:72px;height:72px;font-size:14px;',
    function () {
      var g = G();
      if (g) { g.input.fire = true; g.input.mouseL = true; }
    },
    function () {
      var g = G();
      if (g) { g.input.mouseL = false; }
    });
  makeBtn('AIM', 'right:108px;bottom:196px;width:56px;height:56px;font-size:11px;',
    function () { var g = G(); if (g) g.input.mouseR = true; },
    function () { var g = G(); if (g) g.input.mouseR = false; });

  // Zoom buttons (mouse wheel in the desktop game)
  makeBtn('+', 'right:24px;bottom:296px;width:44px;height:44px;font-size:18px;',
    function () { var g = G(); if (g) g.input.wheel -= 1; });
  makeBtn('-', 'right:76px;bottom:296px;width:44px;height:44px;font-size:18px;',
    function () { var g = G(); if (g) g.input.wheel += 1; });

  // ---------- joystick (bottom left) ----------
  var joyBase = document.getElementById('uuJoyBase');
  var joyKnob = document.getElementById('uuJoyKnob');
  joyBase.style.left = '24px';
  joyBase.style.bottom = '24px';
  var joyId = null, joyCx = 0, joyCy = 0;
  var joyKeys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };

  function setJoyKey(code, on) {
    if (joyKeys[code] === on) return;
    joyKeys[code] = on;
    if (on) keyDown(code); else keyUp(code);
  }
  function joyMove(t) {
    var dx = t.clientX - joyCx, dy = t.clientY - joyCy;
    var max = 44, d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joyKnob.style.left = (36 + dx) + 'px';
    joyKnob.style.top = (36 + dy) + 'px';
    var dead = 12;
    setJoyKey('KeyW', dy < -dead);
    setJoyKey('KeyS', dy > dead);
    setJoyKey('KeyA', dx < -dead);
    setJoyKey('KeyD', dx > dead);
  }
  function joyEnd() {
    joyId = null;
    joyKnob.style.left = '36px'; joyKnob.style.top = '36px';
    for (var k in joyKeys) setJoyKey(k, false);
  }
  joyBase.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var t = e.changedTouches[0];
    joyId = t.identifier;
    var r = joyBase.getBoundingClientRect();
    joyCx = r.left + r.width / 2; joyCy = r.top + r.height / 2;
    joyMove(t);
  }, { passive: false });
  joyBase.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyId) joyMove(e.changedTouches[i]);
    }
  }, { passive: false });
  joyBase.addEventListener('touchend', function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyId) joyEnd();
    }
  });
  joyBase.addEventListener('touchcancel', joyEnd);

  // ---------- camera drag (right side of the screen) ----------
  var camEl = document.getElementById('uuCam');
  var camId = null, camX = 0, camY = 0;
  camEl.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    camId = t.identifier; camX = t.clientX; camY = t.clientY;
  }, { passive: true });
  camEl.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier !== camId) continue;
      var dx = t.clientX - camX, dy = t.clientY - camY;
      camX = t.clientX; camY = t.clientY;
      var g = G();
      if (g) {
        // Same fields the desktop mousemove handler fills.
        g.input.mdx += dx * 2.2;
        g.input.mdy += dy * 2.2;
        g.input.drag = true;
      } else {
        // Fallback: synthetic drag mousemove (game reads it while drag is on)
        try {
          var ev = new MouseEvent('mousemove', { bubbles: true });
          Object.defineProperty(ev, 'movementX', { value: dx * 2.2 });
          Object.defineProperty(ev, 'movementY', { value: dy * 2.2 });
          window.dispatchEvent(ev);
        } catch (err) {}
      }
    }
  }, { passive: false });
  function camEnd(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === camId) {
        camId = null;
        var g = G(); if (g) g.input.drag = false;
      }
    }
  }
  camEl.addEventListener('touchend', camEnd);
  camEl.addEventListener('touchcancel', camEnd);

  // ---------- pointer-lock patch + visibility ----------
  // Desktop flow pauses the game when pointer lock is lost. Mobile WebView has
  // no pointer lock, so: neutralise requestLock, keep input.locked = true while
  // playing (hides CLICK TO PLAY, enables FIRE), and show controls only in play.
  setInterval(function () {
    var g = G();
    if (!g) { root.classList.remove('on'); return; }
    if (!g.__uuPatched) {
      g.__uuPatched = true;
      g.requestLock = function () {};
      g.releaseLock = function () {};
    }
    if (g.state === 'play') {
      g.input.locked = true;
      root.classList.add('on');
    } else {
      root.classList.remove('on');
    }
  }, 200);
})();
