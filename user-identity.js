/**
 * Reads the authenticated user's email from the Cloudflare Access
 * CF_Authorization JWT cookie and exposes it for use across the site.
 *
 * - Sets window.__userEmail so other scripts can reference it.
 * - Appends ?email=... to Tally form links so forms are pre-filled.
 */
(function () {
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function decodeJwtPayload(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  var jwt = getCookie('CF_Authorization');
  if (!jwt) return;

  var payload = decodeJwtPayload(jwt);
  if (!payload || !payload.email) return;

  var email = payload.email;
  window.__userEmail = email;

  // Append email param to all Tally links so forms pre-fill
  function patchTallyLinks() {
    document.querySelectorAll('a[href*="tally.so"]').forEach(function (a) {
      try {
        var url = new URL(a.href);
        if (!url.searchParams.has('email')) {
          url.searchParams.set('email', email);
          a.href = url.toString();
        }
      } catch (e) {
        // skip malformed URLs
      }
    });
  }

  // Run on load and on navigation (Mintlify uses client-side routing)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchTallyLinks);
  } else {
    patchTallyLinks();
  }

  // Re-patch after client-side navigations
  var observer = new MutationObserver(function () {
    patchTallyLinks();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
