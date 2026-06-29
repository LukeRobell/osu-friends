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
    body { background: #0d0d12; color: white; font-family: -apple-system, sans-serif; padding: 24px; }
    .header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .sword { color: #ec4899; font-size: 20px; }
    .title { font-size: 16px; font-weight: 700; }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 18px;
    }
    .step { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
    .step:last-child { margin-bottom: 0; }
    .num {
      width: 22px; height: 22px; border-radius: 50%;
      background: #ec4899; color: white;
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
    }
    .step-text { font-size: 12px; color: #9ca3af; line-height: 1.5; }
    .step-text strong { color: white; }
    a { color: #ec4899; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 18px 0; }
    .note { font-size: 11px; color: #4b5563; line-height: 1.5; }
  </style>
</head>
<body>
  <div style="max-width:340px">
    <div class="header">
      <span class="sword">⚔</span>
      <span class="title">osufriends setup</span>
    </div>
    <div class="card">
      <div class="step">
        <div class="num">1</div>
        <div class="step-text">
          Go to <a href="https://www.osufriends.com" target="_blank">osufriends.com</a> and sign in with your osu! account.
        </div>
      </div>
      <div class="step">
        <div class="num">2</div>
        <div class="step-text">
          Visit your <strong>profile settings</strong> and click <strong>Connect Twitch</strong> to link this channel.
        </div>
      </div>
      <div class="step">
        <div class="num">3</div>
        <div class="step-text">
          Add rivals on your profile — they'll appear automatically in this panel.
        </div>
      </div>
    </div>
    <hr class="divider">
    <p class="note">Once your Twitch account is linked on osufriends.com, this panel will automatically show your rival dashboards to viewers — no further configuration needed.</p>
  </div>
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
