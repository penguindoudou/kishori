---
trigger: always_on
---

# Deployment Instructions

To deploy the site, always run the deployment script:
```bash
./deploy.sh
```

Do not manually copy files. The `deploy.sh` script handles everything, including copying static assets to `_site/` and deploying the main site and Cloudflare Worker using Wrangler.
