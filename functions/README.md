# Firebase Functions Testing

Integration tests in this package run against Firebase emulators and follow the monorepo policy in [`../specs/testing-policy.md`](../specs/testing-policy.md).

## Commands

```bash
# From repo root, inside emulator exec:
firebase emulators:exec --project demo-boda-en-tarifa "npm --prefix functions run test:integration"
```

```bash
# From functions/ when emulator env vars are already set:
npm run test:integration
```
