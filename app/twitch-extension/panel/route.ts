import { NextResponse } from 'next/server';

const CSP = "frame-ancestors 'self' https://supervisor.ext-twitch.tv https://twitch.tv https://*.twitch.tv https://dashboard.twitch.tv https://extension-files.twitch.tv";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>osufriends</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d12; color: white; font-family: -apple-system, sans-serif; padding: 10px; }

    #status-msg { font-size: 11px; color: #4b5563; text-align: center; padding: 20px 0; }

    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 8px;
    }
    .header-left { display: flex; align-items: center; gap: 5px; }
    .sword { color: #ec4899; font-size: 12px; }
    .username { color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 600; }
    .rivals-label { color: #374151; font-size: 10px; }

    .dots { display: flex; align-items: center; gap: 3px; }
    .dot {
      height: 5px; border-radius: 3px;
      background: rgba(255,255,255,0.1);
      transition: all 0.3s ease; display: inline-block;
    }
    .dot.active { background: #ec4899; }

    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 10px 12px;
      transition: opacity 0.4s ease;
    }
    .card.fade { opacity: 0; }

    .rival-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
    }
    .rival-left { display: flex; align-items: center; gap: 7px; }
    .avatar { width: 28px; height: 28px; border-radius: 14px; flex-shrink: 0; }
    .rival-name { color: #f3f4f6; font-size: 12px; font-weight: 700; }
    .rival-stats { color: #4b5563; font-size: 10px; margin-top: 2px; }
    .mode-badge {
      font-size: 9px; padding: 2px 7px;
      background: rgba(255,255,255,0.05);
      border-radius: 99px; color: #6b7280;
    }

    .section-label {
      display: flex; justify-content: space-between;
      font-size: 9px; color: #374151; font-weight: 600;
      margin-bottom: 4px;
    }
    .ahead { color: #34d399; }
    .behind { color: #f87171; }

    .bar-row { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; }
    .bar-label { font-size: 9px; color: #6b7280; width: 22px; flex-shrink: 0; }
    .bar-track {
      flex: 1; height: 5px; border-radius: 5px;
      background: rgba(255,255,255,0.06); overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: 5px; width: 0%; transition: width 1s ease-out; }
    .bar-val { font-size: 9px; color: #9ca3af; width: 52px; text-align: right; flex-shrink: 0; }

    .snipes-row {
      display: flex; justify-content: space-between; align-items: flex-end;
      padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);
      margin-top: 10px;
    }
    .snipes-left { display: flex; align-items: center; gap: 6px; }
    .snipe-lbl { font-size: 9px; color: #374151; font-weight: 600; }
    .snipe-num { font-size: 13px; font-weight: 700; }
    .snipe-vs { font-size: 9px; color: #1f2937; }
    .recent-play { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .play-title { font-size: 9px; color: #4b5563; }
    .play-pp { font-size: 10px; color: #818cf8; font-weight: 700; }

    .footer { margin-top: 6px; text-align: center; color: #374151; font-size: 8px; }
  </style>
</head>
<body>
  <div id="root">
    <p id="status-msg">Loading…</p>
  </div>

  <script>
    var API = 'https://www.osufriends.com';
    var CYCLE_MS = 12000;
    var FADE_MS  = 400;
    var REFRESH_MS = 5 * 60 * 1000;

    var rivals = [];
    var idx = 0;
    var cycleTimer = null;
    var refreshTimer = null;
    var myName = '';

    var MODE_LABELS = { osu: 'osu!', taiko: 'Taiko', fruits: 'Catch', mania: 'Mania' };

    function fmt(n) { return n ? '#' + n.toLocaleString() : '—'; }
    function fmtPp(n) { return n ? Math.round(n) + 'pp' : '—'; }
    function trunc(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

    function setStatus(msg) {
      document.getElementById('root').innerHTML = '<p id="status-msg">' + msg + '</p>';
    }

    function renderDots(total, current) {
      if (total <= 1) return '';
      var html = '<div class="dots">';
      for (var i = 0; i < total; i++) {
        var w = i === current ? 14 : 5;
        html += '<span class="dot' + (i === current ? ' active' : '') + '" style="width:' + w + 'px"></span>';
      }
      return html + '</div>';
    }

    function renderCard(r) {
      var bothRanks = r.myRank && r.rivalRank;
      var myRankBar  = bothRanks ? (Math.min(r.myRank, r.rivalRank) / r.myRank)    * 100 : (r.myRank    ? 100 : 0);
      var rivRankBar = bothRanks ? (Math.min(r.myRank, r.rivalRank) / r.rivalRank) * 100 : (r.rivalRank ? 100 : 0);
      var myRankAhead = !!(r.myRank && r.rivalRank && r.myRank < r.rivalRank);
      var maxPp = Math.max(r.myPp || 0, r.rivalPp || 0);
      var myPpBar  = maxPp > 0 && r.myPp    ? (r.myPp    / maxPp) * 100 : 0;
      var rivPpBar = maxPp > 0 && r.rivalPp ? (r.rivalPp / maxPp) * 100 : 0;
      var myPpAhead = !!(r.myPp && r.rivalPp && r.myPp > r.rivalPp);
      var mySnipesAhead = r.mySnipes >= r.theirSnipes;
      var tag = myName.slice(0, 4);
      var mode = MODE_LABELS[r.mode] || r.mode;

      return '<div class="rival-header">'
        + '<div class="rival-left">'
        + '<img class="avatar" src="' + r.avatarUrl + '" alt="">'
        + '<div><div class="rival-name">⚔ ' + r.username + '</div>'
        + '<div class="rival-stats">' + fmt(r.rivalRank) + ' · ' + fmtPp(r.rivalPp) + '</div></div>'
        + '</div>'
        + '<span class="mode-badge">' + mode + '</span>'
        + '</div>'

        + '<div class="section-label"><span>RANK</span>'
        + (myRankAhead ? '<span class="ahead">You&#39;re ahead</span>' : (bothRanks ? '<span class="behind">They&#39;re ahead</span>' : '<span></span>'))
        + '</div>'
        + '<div class="bar-row"><span class="bar-label">' + tag + '</span><div class="bar-track"><div class="bar-fill" id="bar-mr" style="background:#ec4899"></div></div><span class="bar-val">' + fmt(r.myRank) + '</span></div>'
        + '<div class="bar-row" style="margin-bottom:10px"><span class="bar-label">⚔</span><div class="bar-track"><div class="bar-fill" id="bar-rr" style="background:#818cf8"></div></div><span class="bar-val">' + fmt(r.rivalRank) + '</span></div>'

        + '<div class="section-label"><span>PP</span>'
        + (myPpAhead ? '<span class="ahead">You&#39;re ahead</span>' : ((r.myPp && r.rivalPp) ? '<span class="behind">They&#39;re ahead</span>' : '<span></span>'))
        + '</div>'
        + '<div class="bar-row"><span class="bar-label">' + tag + '</span><div class="bar-track"><div class="bar-fill" id="bar-mp" style="background:#ec4899"></div></div><span class="bar-val">' + fmtPp(r.myPp) + '</span></div>'
        + '<div class="bar-row"><span class="bar-label">⚔</span><div class="bar-track"><div class="bar-fill" id="bar-rp" style="background:#818cf8"></div></div><span class="bar-val">' + fmtPp(r.rivalPp) + '</span></div>'

        + '<div class="snipes-row">'
        + '<div class="snipes-left"><span class="snipe-lbl">SNIPES</span>'
        + '<span class="snipe-num" style="color:' + (mySnipesAhead ? '#ec4899' : '#4b5563') + '">' + r.mySnipes + '</span>'
        + '<span class="snipe-vs">vs</span>'
        + '<span class="snipe-num" style="color:' + (!mySnipesAhead ? '#818cf8' : '#4b5563') + '">' + r.theirSnipes + '</span>'
        + '</div>'
        + (r.recentPlay ? '<div class="recent-play"><span class="play-title">♪ ' + trunc(r.recentPlay.title, 26) + '</span><span class="play-pp">' + r.recentPlay.pp + 'pp</span></div>' : '')
        + '</div>';
    }

    function animateBars(r) {
      var bothRanks = r.myRank && r.rivalRank;
      var myRankPct  = bothRanks ? (Math.min(r.myRank, r.rivalRank) / r.myRank)    * 100 : (r.myRank    ? 100 : 0);
      var rivRankPct = bothRanks ? (Math.min(r.myRank, r.rivalRank) / r.rivalRank) * 100 : (r.rivalRank ? 100 : 0);
      var maxPp = Math.max(r.myPp || 0, r.rivalPp || 0);
      var myPpPct  = maxPp > 0 && r.myPp    ? (r.myPp    / maxPp) * 100 : 0;
      var rivPpPct = maxPp > 0 && r.rivalPp ? (r.rivalPp / maxPp) * 100 : 0;
      setTimeout(function() {
        var mr = document.getElementById('bar-mr'); if (mr) mr.style.width = myRankPct + '%';
        var rr = document.getElementById('bar-rr'); if (rr) rr.style.width = rivRankPct + '%';
        var mp = document.getElementById('bar-mp'); if (mp) mp.style.width = myPpPct + '%';
        var rp = document.getElementById('bar-rp'); if (rp) rp.style.width = rivPpPct + '%';
      }, 80);
    }

    function showRival(i) {
      if (!rivals.length) return;
      var r = rivals[i];
      var root = document.getElementById('root');
      root.innerHTML =
        '<div class="header">'
        + '<div class="header-left"><span class="sword">⚔</span><span class="username">' + myName + '</span><span class="rivals-label">· rivals</span></div>'
        + renderDots(rivals.length, i)
        + '</div>'
        + '<div class="card" id="card">' + renderCard(r) + '</div>'
        + '<div class="footer">osufriends.com</div>';
      animateBars(r);
    }

    function startCycle() {
      if (cycleTimer) clearInterval(cycleTimer);
      if (rivals.length <= 1) return;
      cycleTimer = setInterval(function() {
        var card = document.getElementById('card');
        if (card) card.classList.add('fade');
        setTimeout(function() {
          idx = (idx + 1) % rivals.length;
          showRival(idx);
        }, FADE_MS);
      }, CYCLE_MS);
    }

    function loadRivals(username) {
      fetch(API + '/api/widget/' + encodeURIComponent(username) + '/data')
        .then(function(res) { return res.ok ? res.json() : null; })
        .then(function(data) {
          if (!data || !data.rivals || !data.rivals.length) {
            setStatus('No rivals yet');
            return;
          }
          myName = data.username || username;
          rivals = data.rivals;
          idx = 0;
          showRival(0);
          startCycle();
        })
        .catch(function() { setStatus('Failed to load rivals'); });
    }

    var authorized = false;

    function showFallback() {
      if (authorized) return;
      document.getElementById('root').innerHTML =
        '<div style="padding:4px 0">'
        + '<p style="font-size:11px;color:#6b7280;margin-bottom:8px">Enter your osufriends username:</p>'
        + '<input id="fb-input" type="text" placeholder="e.g. Sinzuna" autocomplete="off" style="width:100%;padding:7px 9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:white;font-size:12px;box-sizing:border-box;margin-bottom:8px;outline:none">'
        + '<button id="fb-btn" style="width:100%;padding:8px;background:#ec4899;border:none;border-radius:6px;color:white;font-size:12px;font-weight:600;cursor:pointer">Load Rivals</button>'
        + '</div>';
      document.getElementById('fb-btn').addEventListener('click', function() {
        var u = document.getElementById('fb-input').value.trim();
        if (u) { setStatus('Loading…'); loadRivals(u); }
      });
    }

    function tryOnAuthorized() {
      if (!window.Twitch || !window.Twitch.ext) { showFallback(); return; }
      var authTimer = setTimeout(showFallback, 4000);
      window.Twitch.ext.onAuthorized(function(auth) {
        clearTimeout(authTimer);
        authorized = true;
        var channelId = auth.channelId;
        if (!channelId) { showFallback(); return; }
        fetch(API + '/api/twitch-extension/panel?channelId=' + channelId)
          .then(function(res) { return res.ok ? res.json() : null; })
          .then(function(data) {
            if (!data || !data.username) { showFallback(); return; }
            loadRivals(data.username);
            if (refreshTimer) clearInterval(refreshTimer);
            refreshTimer = setInterval(function() { loadRivals(data.username); }, REFRESH_MS);
          })
          .catch(function() { showFallback(); });
      });
    }

    // Load Twitch helper async — doesn't block our script
    var helperScript = document.createElement('script');
    helperScript.src = 'https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js';
    helperScript.onload = tryOnAuthorized;
    helperScript.onerror = showFallback;
    document.head.appendChild(helperScript);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': CSP,
      'Cache-Control': 'no-store',
    },
  });
}
