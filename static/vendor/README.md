# Vendored JS

By default the app loads htmx and Alpine.js from `unpkg.com` (see
`commandcrafter/templates/base.html`). To run fully offline, drop these
two files here:

```bash
curl -fLo static/vendor/htmx.min.js  https://unpkg.com/htmx.org@1.9.12/dist/htmx.min.js
curl -fLo static/vendor/alpine.min.js https://unpkg.com/alpinejs@3.14.1/dist/cdn.min.js
```

Then edit `base.html` to swap the `<script src>` URLs for
`{{ url_for('static', filename='vendor/htmx.min.js') }}` and the equivalent
for Alpine. No build step required.
