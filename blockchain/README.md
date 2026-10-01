# Soapy Miners — Blockchain

Hardhat project for the `SoapyMiners` ERC-721 contract on Quai Network.

## Setup

```bash
npm install
cp .env.example .env
```

## Commands

```bash
npm run compile
npm run test
npm run deploy:orchard
```

## Layout

- `contracts/` — Solidity source
- `test/` — Hardhat tests
- `scripts/deploy.js` — Orchard deployment script
- `artifacts/` — Compiled contract output (generated)
- `deployment/` — Deployment records
