import { NextResponse } from 'next/server';

const CSP = "frame-ancestors 'self' https://supervisor.ext-twitch.tv https://twitch.tv https://*.twitch.tv https://dashboard.twitch.tv https://extension-files.twitch.tv";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>osufriends config</title>
  <script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d12; color: white; font-family: -apple-system, sans-serif; padding: 20px; }
    .header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .sword { color: #ec4899; font-size: 18px; }
    .title { font-size: 16px; font-weight: 700; }
    .desc { font-size: 12px; color: #6b7280; margin-bottom: 16px; line-height: 1.5; }
    label { font-size: 12px; color: #9ca3af; display: block; margin-bottom: 6px; }
    input {
      width: 100%; padding: 8px 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px; color: white; font-size: 13px;
      margin-bottom: 10px; outline: none;
    }
    input:focus { border-color: #ec4899; }
    button {
      width: 100%; padding: 9px;
      background: #ec4899; border: none; border-radius: 6px;
      color: white; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: opacity 0.2s;
    }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    #status { font-size: 11px; margin-top: 12px; text-align: center; min-height: 16px; }
  </style>
</head>
<body>
  <div style="max-width:340px">
    <div class="header">
      <span class="sword">⚔</span>
      <span class="title">osufriends configuration</span>
    </div>
    <p class="desc">Enter your osufriends username to show your rival dashboard on your Twitch panel.</p>
    <label for="username">osufriends username</label>
    <input id="username" type="text" placeholder="e.g. Sinzuna" autocomplete="off" />
    <button id="save" disabled>Save</button>
    <p id="status"></p>
  </div>

  <script>
    var input = document.getElementById('username');
    var btn   = document.getElementById('save');
    var status = document.getElementById('status');

    input.addEventListener('input', function() {
      btn.disabled = !input.value.trim();
    });

    function tryRead() {
      try {
        var raw = window.Twitch
          && window.Twitch.ext
          && window.Twitch.ext.configuration
          && window.Twitch.ext.configuration.broadcaster
          && window.Twitch.ext.configuration.broadcaster.content;
        if (raw) {
          var cfg = JSON.parse(raw);
          if (cfg && cfg.username) input.value = cfg.username;
          btn.disabled = !input.value.trim();
        }
      } catch(e) {}
    }

    btn.addEventListener('click', function() {
      var username = input.value.trim();
      if (!username) return;
      try {
        window.Twitch.ext.configuration.set('broadcaster', '1', JSON.stringify({ username: username }));
        status.textContent = 'Saved!';
        status.style.color = '#34d399';
        setTimeout(function() { status.textContent = ''; }, 2500);
      } catch(e) {
        status.textContent = 'Error: ' + e.message;
        status.style.color = '#f87171';
      }
    });

    if (window.Twitch && window.Twitch.ext) {
      tryRead();
      window.Twitch.ext.configuration.onChanged(tryRead);
      window.Twitch.ext.onAuthorized(tryRead);
    }
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
