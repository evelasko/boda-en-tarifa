set shell := ["bash", "-euo", "pipefail", "-c"]

default: help

PROJECT_ID := "demo-boda-en-tarifa"
EMULATOR_HOST := "127.0.0.1"
FIRESTORE_PORT := "8080"
AUTH_PORT := "9099"
FUNCTIONS_PORT := "5001"

help:
  @echo "Boda en Tarifa monorepo commands"
  @echo ""
  @echo "Discovery and setup:"
  @echo "  help | menu | doctor | env-check | setup-all | setup-web | setup-functions | setup-scripts | setup-bot-scripts | setup-app"
  @echo "Emulator lifecycle:"
  @echo "  emu-start | emu-start-core | emu-stop | emu-status | emu-exec <command...> | emu-reset"
  @echo "Data lifecycle:"
  @echo "  data-seed | data-seed-rsvp | data-seed-migration | data-clear | data-clear-rsvp | data-clear-migration | data-reset | data-menu"
  @echo "Web / Functions / App:"
  @echo "  web-dev web-build web-start web-lint web-clean web-deploy"
  @echo "  fx-build fx-watch fx-lint fx-serve fx-shell fx-logs fx-deploy fx-test-int"
  @echo "  app-pub-get app-analyze app-test app-run app-run-emu app-build-android app-build-ios app-gen"
  @echo "Quality and tests:"
  @echo "  check | check-full | test | test-int | qa-smoke | qa-simulator-prep"
  @echo "Firebase and ops:"
  @echo "  fb-status fb-use <alias> fb-deploy-all fb-deploy-functions fb-deploy-hosting fb-deploy-remoteconfig fb-deploy-rules"
  @echo "  ops-magic-links ops-magic-links-dry ops-magic-links-emulator ops-magic-links-emulator-dry ops-guest-audit ops-guest-backup ops-linear-list ops-linear-get <id> ops-linear-id <id>"
  @echo "Bot scripts (one-off operator tools):"
  @echo "  bot-spotify-auth | bot-upload-photos <slug | --all> [--dry-run] | bot-upload-photos-dry <slug | --all>"
  @echo "Golden path flows:"
  @echo "  flow-dev-app flow-dev-web flow-test-functions flow-qa-smoke flow-release-web flow-release-functions"
  @echo "Menus:"
  @echo "  menu menu-dev menu-data menu-qa menu-deploy"
  @echo ""
  @echo "Destructive recipes require CONFIRM=1 for non-interactive use."

_fx_test_cmd := "npm --prefix functions run test:integration --if-present"

doctor:
  @echo "Tooling diagnostics"
  @if command -v just >/dev/null 2>&1; then printf "  ✅ just: "; just --version | head -n 1; else echo "  ❌ just: not found"; fi
  @if command -v gum >/dev/null 2>&1; then printf "  ✅ gum: "; gum --version | head -n 1; else echo "  ❌ gum: not found"; fi
  @if command -v firebase >/dev/null 2>&1; then printf "  ✅ firebase: "; firebase --version | head -n 1; else echo "  ❌ firebase: not found"; fi
  @if command -v node >/dev/null 2>&1; then printf "  ✅ node: "; node --version | head -n 1; else echo "  ❌ node: not found"; fi
  @if command -v npm >/dev/null 2>&1; then printf "  ✅ npm: "; npm --version | head -n 1; else echo "  ❌ npm: not found"; fi
  @if command -v flutter >/dev/null 2>&1; then printf "  ✅ flutter: "; flutter --version | head -n 1; else echo "  ❌ flutter: not found"; fi
  @if command -v python3 >/dev/null 2>&1; then printf "  ✅ python3: "; python3 --version | head -n 1; else echo "  ❌ python3: not found"; fi

env-check:
  @echo "Project: {{PROJECT_ID}}"
  @echo "Emulators: firestore={{EMULATOR_HOST}}:{{FIRESTORE_PORT}}, auth={{EMULATOR_HOST}}:{{AUTH_PORT}}, functions={{EMULATOR_HOST}}:{{FUNCTIONS_PORT}}"
  @if [ -z "${LINEAR_API_KEY:-}" ]; then echo "  ⚠️  LINEAR_API_KEY missing (needed for ops-linear-*)"; else echo "  ✅ LINEAR_API_KEY is set"; fi
  @if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then echo "  ⚠️  GOOGLE_APPLICATION_CREDENTIALS missing (needed for ops-magic-links, ops-guest-audit, ops-guest-backup; not required for ops-magic-links-emulator)"; else echo "  ✅ GOOGLE_APPLICATION_CREDENTIALS is set"; fi

setup-all: setup-web setup-functions setup-scripts setup-bot-scripts setup-app

setup-web:
  npm --prefix web install

setup-functions:
  npm --prefix functions install

setup-scripts:
  npm --prefix scripts install

setup-bot-scripts:
  npm --prefix bot/scripts install

setup-app:
  flutter pub get --directory app

emu-start:
  @echo "Starting emulator suite for {{PROJECT_ID}}"
  firebase emulators:start --project {{PROJECT_ID}}

emu-start-core:
  @echo "Starting core emulators (auth, firestore, functions, pubsub, eventarc) for {{PROJECT_ID}}"
  firebase emulators:start --project {{PROJECT_ID}} --only auth,firestore,functions,pubsub,eventarc

emu-stop:
  @echo "Stopping Firebase emulator processes"
  @pkill -f "firebase.*emulators:start" >/dev/null 2>&1 || true
  @pkill -f "firebase-emulators" >/dev/null 2>&1 || true
  @echo "Done."

emu-status:
  @echo "Project context and emulator ports"
  firebase use
  @echo "Expected local ports: firestore={{FIRESTORE_PORT}}, auth={{AUTH_PORT}}, functions={{FUNCTIONS_PORT}}"

emu-exec +cmd:
  firebase emulators:exec --project {{PROJECT_ID}} "{{cmd}}"

emu-ensure-core +cmd:
  @if lsof -PiTCP:{{AUTH_PORT}} -sTCP:LISTEN -t >/dev/null 2>&1 && \
      lsof -PiTCP:{{FIRESTORE_PORT}} -sTCP:LISTEN -t >/dev/null 2>&1 && \
      lsof -PiTCP:{{FUNCTIONS_PORT}} -sTCP:LISTEN -t >/dev/null 2>&1; then \
    echo "Reusing running emulators on auth={{AUTH_PORT}}, firestore={{FIRESTORE_PORT}}, functions={{FUNCTIONS_PORT}}"; \
    FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} bash -euo pipefail -c "{{cmd}}"; \
  else \
    echo "Core emulators not fully running; starting temporary stack via emulators:exec"; \
    firebase emulators:exec --project {{PROJECT_ID}} --only auth,firestore,functions,pubsub,eventarc "FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} {{cmd}}"; \
  fi

emu-reset: _require_confirm
  @echo "Clearing and reseeding emulator data for {{PROJECT_ID}}"
  just data-reset CONFIRM=1

data-seed:
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run seed:emulator -- --project {{PROJECT_ID}}

data-seed-rsvp:
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run seed:emulator -- --project {{PROJECT_ID}} --include-rsvp

data-seed-migration:
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run seed:emulator -- --project {{PROJECT_ID}} --include-migration-case

data-clear: _require_confirm
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run clear:emulator -- --project {{PROJECT_ID}}

data-clear-rsvp: _require_confirm
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run clear:emulator -- --project {{PROJECT_ID}} --include-rsvp

data-clear-migration: _require_confirm
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run clear:emulator -- --project {{PROJECT_ID}} --include-migration-case

data-reset: _require_confirm
  just data-clear CONFIRM=1
  just data-seed

data-menu:
  @command -v gum >/dev/null 2>&1 || (echo "gum is required for interactive menus" && exit 1)
  @choice=$$(gum choose "seed default" "seed with rsvp" "seed with migration" "clear default (destructive)" "clear rsvp (destructive)" "clear migration (destructive)" "reset dataset (destructive)" "back"); \
  case "$$choice" in \
    "seed default") just data-seed ;; \
    "seed with rsvp") just data-seed-rsvp ;; \
    "seed with migration") just data-seed-migration ;; \
    "clear default (destructive)") gum confirm "Clear seeded data?" && just data-clear CONFIRM=1 ;; \
    "clear rsvp (destructive)") gum confirm "Clear RSVP dataset?" && just data-clear-rsvp CONFIRM=1 ;; \
    "clear migration (destructive)") gum confirm "Clear migration dataset?" && just data-clear-migration CONFIRM=1 ;; \
    "reset dataset (destructive)") gum confirm "Clear and reseed dataset?" && just data-reset CONFIRM=1 ;; \
    *) true ;; \
  esac

web-dev:
  npm --prefix web run dev

web-build:
  npm --prefix web run build

web-start:
  npm --prefix web run start

web-lint:
  npm --prefix web run lint

web-clean:
  npm --prefix web run clean

web-deploy:
  npm --prefix web run deploy

fx-build:
  npm --prefix functions run build

fx-watch:
  npm --prefix functions run build:watch

fx-lint:
  npm --prefix functions run lint

fx-serve:
  npm --prefix functions run serve

fx-shell:
  npm --prefix functions run shell

fx-logs:
  npm --prefix functions run logs

fx-deploy:
  npm --prefix functions run deploy

fx-test-int:
  just emu-ensure-core "{{_fx_test_cmd}}"

app-pub-get:
  flutter pub get --directory app

app-analyze:
  flutter analyze app

app-test:
  flutter test app

app-run:
  flutter run --target app/lib/main.dart

app-run-emu:
  flutter run --target app/lib/main.dart --dart-define=USE_FIREBASE_EMULATORS=true --dart-define=FIREBASE_EMULATOR_HOST={{EMULATOR_HOST}} --dart-define=FIRESTORE_EMULATOR_PORT={{FIRESTORE_PORT}} --dart-define=FIREBASE_AUTH_EMULATOR_PORT={{AUTH_PORT}}

app-build-android:
  flutter build appbundle --target app/lib/main.dart

app-build-ios:
  flutter build ios --target app/lib/main.dart

app-gen:
  dart run build_runner build --delete-conflicting-outputs

check:
  just web-lint
  just fx-lint
  just app-analyze

check-full:
  just check
  just web-build
  just fx-build
  just app-test

test:
  just app-test
  npm --prefix web run test --if-present

test-int:
  just fx-test-int

qa-smoke:
  just env-check
  just check
  just data-seed

qa-simulator-prep: _require_confirm
  just emu-reset CONFIRM=1

fb-status:
  firebase use
  firebase projects:list

fb-use alias:
  firebase use {{alias}}

fb-deploy-all:
  firebase deploy

fb-deploy-functions:
  firebase deploy --only functions

fb-deploy-hosting:
  firebase deploy --only hosting

fb-deploy-remoteconfig:
  firebase deploy --only remoteconfig

fb-deploy-rules:
  firebase deploy --only firestore

ops-magic-links:
  npm --prefix scripts run generate-links

ops-magic-links-dry:
  npm --prefix scripts run generate-links:dry

# Magic links for seeded Auth users (emulators only; set FIRESTORE_/FIREBASE_AUTH_ emulator hosts).
ops-magic-links-emulator *args:
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run generate-links:emulator -- --project {{PROJECT_ID}} {{args}}

ops-magic-links-emulator-dry *args:
  FIRESTORE_EMULATOR_HOST={{EMULATOR_HOST}}:{{FIRESTORE_PORT}} FIREBASE_AUTH_EMULATOR_HOST={{EMULATOR_HOST}}:{{AUTH_PORT}} npm --prefix scripts run generate-links:emulator:dry -- --project {{PROJECT_ID}} {{args}}

ops-guest-audit:
  npm --prefix scripts run audit:guests

ops-guest-backup:
  npm --prefix scripts run backup:guests

ops-linear-list:
  python3 scripts/linear.py list-todo

ops-linear-get issue:
  python3 scripts/linear.py get-issue {{issue}}

ops-linear-id issue:
  python3 scripts/linear.py get-issue-id {{issue}}

# ──────────────────────────────────────────────────────────────────────
# Bot scripts (one-off operator tools — see bot/scripts/ and bot/docs/)
# ──────────────────────────────────────────────────────────────────────
# All bot scripts are invoked from the repo root so they can resolve
# bot/.env via cwd-relative paths. Node's module resolution still finds
# bot/scripts/node_modules/ because it walks up from the script's own
# location, not cwd.

# One-time Spotify OAuth helper. Zero deps — runs on bare node.
bot-spotify-auth:
  node bot/scripts/spotify-auth.mjs

# Sync reference photos for guest dossiers to Cloudinary, write signed
# URLs back to the per-guest dossier.yaml. Requires `just setup-bot-scripts`
# beforehand (installs cloudinary + yaml).
#
# Examples:
#   just bot-upload-photos javier-otero
#   just bot-upload-photos --all
#   just bot-upload-photos javier-otero --dry-run
bot-upload-photos *args:
  node bot/scripts/upload-reference-photos.mjs {{args}}

# Convenience: dry-run preview (no Cloudinary upload, no YAML write).
#   just bot-upload-photos-dry javier-otero
#   just bot-upload-photos-dry --all
bot-upload-photos-dry *args:
  node bot/scripts/upload-reference-photos.mjs {{args}} --dry-run

flow-dev-app:
  just env-check
  just emu-ensure-core "echo Core emulators ready."
  just data-seed
  just app-run-emu

flow-dev-web:
  just env-check
  just data-seed-rsvp
  just web-dev

flow-test-functions:
  just env-check
  just fx-test-int

flow-qa-smoke:
  just qa-simulator-prep CONFIRM=1
  just qa-smoke

flow-release-web:
  just check-full
  just web-deploy

flow-release-functions:
  just check-full
  just fb-deploy-functions

menu:
  @command -v gum >/dev/null 2>&1 || (echo "gum is required for interactive menus" && exit 1)
  @echo "Project={{PROJECT_ID}} | Firestore={{FIRESTORE_PORT}} Auth={{AUTH_PORT}} Functions={{FUNCTIONS_PORT}}"
  @choice=$$(gum choose "dev menu" "data menu" "qa menu" "deploy menu" "doctor" "exit"); \
  case "$$choice" in \
    "dev menu") just menu-dev ;; \
    "data menu") just menu-data ;; \
    "qa menu") just menu-qa ;; \
    "deploy menu") just menu-deploy ;; \
    "doctor") just doctor ;; \
    *) true ;; \
  esac

menu-dev:
  @choice=$$(gum choose "app flow" "web flow" "app run" "app run emulator" "web dev" "functions serve" "back"); \
  case "$$choice" in \
    "app flow") just flow-dev-app ;; \
    "web flow") just flow-dev-web ;; \
    "app run") just app-run ;; \
    "app run emulator") just app-run-emu ;; \
    "web dev") just web-dev ;; \
    "functions serve") just fx-serve ;; \
    *) true ;; \
  esac

menu-data:
  just data-menu

menu-qa:
  @choice=$$(gum choose "check" "check full" "test" "integration test" "smoke" "simulator prep (destructive)" "back"); \
  case "$$choice" in \
    "check") just check ;; \
    "check full") just check-full ;; \
    "test") just test ;; \
    "integration test") just test-int ;; \
    "smoke") just qa-smoke ;; \
    "simulator prep (destructive)") gum confirm "Run simulator prep?" && just qa-simulator-prep CONFIRM=1 ;; \
    *) true ;; \
  esac

menu-deploy:
  @choice=$$(gum choose "status" "deploy all" "deploy functions" "deploy hosting" "deploy remote config" "deploy firestore rules" "back"); \
  case "$$choice" in \
    "status") just fb-status ;; \
    "deploy all") gum confirm "Deploy all Firebase targets?" && just fb-deploy-all ;; \
    "deploy functions") gum confirm "Deploy functions?" && just fb-deploy-functions ;; \
    "deploy hosting") gum confirm "Deploy hosting?" && just fb-deploy-hosting ;; \
    "deploy remote config") gum confirm "Deploy Remote Config?" && just fb-deploy-remoteconfig ;; \
    "deploy firestore rules") gum confirm "Deploy Firestore rules/indexes?" && just fb-deploy-rules ;; \
    *) true ;; \
  esac

_require_confirm:
  @if [ "${CONFIRM:-0}" != "1" ]; then \
    echo "This command is destructive. Re-run with CONFIRM=1."; \
    exit 1; \
  fi
