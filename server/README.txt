# Food Deals API

This server uses OpenStreetMap (100% free). No API keys or credit cards required!
Create a .env file with your port if you want to change it:

```
GOOGLE_PLACES_API_KEY=AIza...
PORT=3000
```

Run from repo root:

```
cd server && npm install && npm start
```

Point the mobile app at this server (developer / build config only):

```
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:3000
```

Or use `local.keys.json` in the project root: `{ "apiBaseUrl": "https://your-deployed-host.com" }` (no trailing slash).

Deploy: any Node host (Render, Fly, Railway). Set `GOOGLE_PLACES_API_KEY` in the host dashboard. Enable Places API (New) on that key in Google Cloud.
