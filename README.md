# Healthcare Leaders of San Antonio — App

A installable Progressive Web App (PWA) for HLSA: monthly mixer details, sponsors, referral partners, and the newsletter/blog feed (pulled live from healthcareleaderssa.com).

No build step — it's plain HTML/CSS/JS, so it can be hosted anywhere that serves static files.

## Deploying to GitHub Pages

1. Create a new **public** repository on GitHub (e.g. `hlsa-app`).
2. From this folder, push it up:

   ```bash
   git remote add origin https://github.com/<your-username>/hlsa-app.git
   git branch -M main
   git push -u origin main
   ```

3. In the repo on GitHub: **Settings → Pages → Source → Deploy from a branch**, pick `main` and `/ (root)`, then Save.
4. GitHub gives you a URL like `https://<your-username>.github.io/hlsa-app/` — that's the live app. Open it on a phone and use "Add to Home Screen" (iOS Safari: Share → Add to Home Screen; Android Chrome: menu → Install app).

## Updating content later

- **Sponsors**: edit the `LOGO` placeholder blocks in `index.html` (search for `logo-box`) — swap in `<img>` tags once you have logos and tiers.
- **Referral partners**: each partner is a `.partner-card` block in `index.html` — copy/edit/remove as the roster changes.
- **Blog posts / newsletter**: these load automatically from `healthcareleaderssa.com`'s WordPress API — no edits needed when you publish a new post.
- **Mixer date/time/location**: search `index.html` for "Marriott San Antonio Airport" to update the recurring event details.

After any edit, bump the cache name in `sw.js` (e.g. `hlsa-app-v2`) so installed devices pick up the change.
