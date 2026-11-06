/* GA4 loads only after explicit analytics consent. No Firebase SDK or API key. */
(() => {
  'use strict';
  const MID = 'G-459J7LLMKJ';
  const KEY = 'mubi_cookie_consent_v1';
  const TTL = 180 * 86400000;
  const banner = document.querySelector('#cookieBanner');
  const dialog = document.querySelector('#cookiePreferences');
  const toggle = document.querySelector('#cookieAnalytics');
  if (!banner || !dialog || !toggle) return;

  let choice = null;
  let loaded = false;
  let loading = false;
  let revision = 0;
  window['ga-disable-' + MID] = true;

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      return value && value.version === 1 && typeof value.analytics === 'boolean' &&
        typeof value.expiresAt === 'number' && value.expiresAt > Date.now() &&
        value.expiresAt <= Date.now() + TTL + 60000 ? value : null;
    } catch { return null; }
  }

  function clearCookies() {
    const names = document.cookie.split(';').map(x => x.trim().split('=')[0])
      .filter(x => x === '_ga' || x.startsWith('_ga_'));
    const parts = location.hostname.split('.');
    const domains = ['', ...parts.map((_, i) => parts.slice(i).join('.')).filter(x => x.includes('.'))];
    for (const name of names) for (const domain of domains) {
      document.cookie = name + '=; Max-Age=0; path=/;' +
        (domain ? ' domain=' + domain + ';' : '') + ' SameSite=Lax';
    }
  }

  function start() {
    if (!choice?.analytics || loaded || loading) return;
    const stamp = revision;
    loading = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MID);
    script.onload = () => {
      loading = false;
      loaded = true;
      if (stamp !== revision || !choice?.analytics) return;
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window['ga-disable-' + MID] = false;
      window.gtag('js', new Date());
      window.gtag('config', MID, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: TTL / 1000,
        cookie_update: false,
        cookie_domain: location.hostname
      });
    };
    script.onerror = () => { loading = false; window['ga-disable-' + MID] = true; };
    document.head.appendChild(script);
  }

  function apply(value) {
    revision++;
    choice = value;
    toggle.checked = !!value?.analytics;
    banner.hidden = !!value;
    if (value?.analytics) { start(); return; }
    window['ga-disable-' + MID] = true;
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    clearCookies();
  }

  function save(allow) {
    const wasLoaded = loaded || loading;
    const value = { version: 1, analytics: allow, expiresAt: Date.now() + TTL };
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
    apply(value);
    if (dialog.open) dialog.close();
    if (!allow && wasLoaded) location.reload();
  }

  document.querySelectorAll('[data-cookie-accept]').forEach(b => b.addEventListener('click', () => save(true)));
  document.querySelectorAll('[data-cookie-reject]').forEach(b => b.addEventListener('click', () => save(false)));
  document.querySelectorAll('[data-cookie-preferences]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    toggle.checked = !!choice?.analytics;
    if (!dialog.open) dialog.showModal();
  }));
  document.querySelector('[data-cookie-save]')?.addEventListener('click', () => save(toggle.checked));
  document.querySelector('[data-cookie-close]')?.addEventListener('click', () => dialog.close());
  addEventListener('storage', e => {
    if (e.key !== KEY) return;
    const wasLoaded = loaded || loading;
    apply(read());
    if (wasLoaded && !choice?.analytics) location.reload();
  });
  apply(read());
})();
