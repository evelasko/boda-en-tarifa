# Phone-Delivered Magic Link Rollout Runbook

## Scope
Operational checklist for migrating guest onboarding to phone-delivered custom-token links with UID-first authorization.

## Phase gates
1. **Preflight**
   - Run `just ops-guest-backup` and store artifact in secure ops storage.
   - Run `just ops-guest-audit` and resolve all errors.
   - Confirm no active bulk send campaigns.
2. **Integration validation**
   - Run `just fx-test-int`.
   - Validate `generateMagicLink` creates `magic_link_issues` docs and returns `linkId`.
   - Validate `onUserCreate` authorizes `guests/{uid}` without requiring email.
3. **Pilot cohort**
   - Send links to a controlled guest subset.
   - Track open-to-auth conversion and unauthorized rate.
4. **Full rollout**
   - Enable bulk sends through WhatsApp/SMS payloads.
   - Keep cleanup in dry-run for first week.

## Monitoring
- Function logs:
  - `Magic link generated`
  - `UID not found in guest allowlist`
  - `Cleanup completed` (`dryRun`, `totalCandidates`, `totalDeleted`)
- Operational thresholds:
  - Unauthorized claims > 2% in 1h window => pause sends and investigate guest UID mismatches.
  - Link generation 429 spikes => tune rate limit windows.
  - Login failures due to expiry > 10% => increase TTL temporarily.

## Rollback
1. Disable single-use and revoke-by-default behavior:
   - `MAGIC_LINK_SINGLE_USE_ENABLED=false`
   - `MAGIC_LINK_REVOKE_PREVIOUS_ENABLED=false`
2. Increase TTL fallback:
   - `MAGIC_LINK_TTL_MINUTES=60`
3. Keep UID-first auth in place unless explicit recovery branch is deployed.
4. If critical incident persists, suspend bulk sending and use manual per-guest link generation.
