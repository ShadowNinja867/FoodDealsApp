#!/usr/bin/env bash
# Sets REACT_NATIVE_PACKAGER_HOSTNAME so Expo Go on your phone can reach Metro.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IP=""
if IP="$(node scripts/detect-packager-host.js 2>/dev/null)" && [[ -n "${IP}" ]]; then
  export REACT_NATIVE_PACKAGER_HOSTNAME="${IP}"
  echo "Using REACT_NATIVE_PACKAGER_HOSTNAME=${IP} (open Expo Go on the same Wi‑Fi)"
  exec npx expo start --lan
fi

echo ""
echo "Could not find a usable Wi‑Fi/LAN IPv4 on this Mac."
echo ""
echo "Common causes:"
echo "  • iCloud Private Relay is ON (Settings → Apple ID → iCloud → Private Relay)."
echo "    It can expose 192.0.0.x — phones cannot reach that. Turn Private Relay OFF for Wi‑Fi, then retry."
echo "  • VPN is splitting traffic or hiding your real LAN IP. Turn VPN off briefly to test."
echo ""
echo "Workarounds:"
echo "  1) Android + USB cable:  npm run start:usb-android"
echo "     (uses adb reverse so Expo Go talks to your Mac on port 8081)"
echo "  2) Set your Mac’s Wi‑Fi IP by hand, then:"
echo "       export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.x.x"
echo "       npx expo start --lan"
echo ""
exit 1
