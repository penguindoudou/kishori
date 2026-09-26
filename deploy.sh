#!/bin/bash
set -e
mkdir -p _site
cp index.html main.js style.css 404.html robots.txt sitemap.xml thank-you.html _site/
cp -r assets articles _site/
npx wrangler deploy
cd worker && npx wrangler deploy
echo "✅ Done"
