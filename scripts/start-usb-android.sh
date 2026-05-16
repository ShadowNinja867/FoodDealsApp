#!/usr/bin/env bash
# Android + USB: forward Metro (8081) from phone to this Mac, then start Expo in localhost mode.
set -euo pipefail

find_adb() {
  if command -v adb >/dev/null 2>&1; then
    command -v adb
    return 0
  fi
  local paths=(
    "${ANDROID_HOME:-}/platform-tools/adb"
    "${ANDROID_SDK_ROOT:-}/platform-tools/adb"
    "$HOME/Library/Android/sdk/platform-tools/adb"
  )
  for p in "${paths[@]}"; do
    if [[ -n "$p" && -x "$p" ]]; then
      printf '%s' "$p"
      return 0
    fi
  done
  return 1
}

ADB="$(find_adb || true)"
if [[ -z "${ADB}" ]]; then
  echo "adb was not found."
  echo ""
  echo "Install Android platform-tools (includes adb):"
  echo "  • If you use Android Studio: open it → Settings → Languages & Frameworks → Android SDK"
  echo "    → SDK Tools → check \"Android SDK Platform-Tools\" → Apply."
  echo "  • Or download: https://developer.android.com/tools/releases/platform-tools"
  echo ""
  echo "Then either add platform-tools to your PATH, or run again (this script also checks:"
  echo "  ~/Library/Android/sdk/platform-tools/adb"
  echo ""
  exit 1
fi

echo "Using adb: ${ADB}"
"$ADB" devices
"$ADB" reverse tcp:8081 tcp:8081
"$ADB" reverse tcp:3000 tcp:3000
echo "Ports 8081 (Metro) and 3000 (Food Deals API) on the phone forward to this Mac."
exec npx expo start --localhost
