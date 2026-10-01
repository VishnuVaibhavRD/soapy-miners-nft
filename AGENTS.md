# Soapy Miners

## Project layout

```
src/                 Next.js frontend (public site + /admin)
public/              Static assets
scripts/             Frontend utility scripts
blockchain/          Hardhat + Solidity contracts
  contracts/         SoapyMiners.sol
  test/              Contract tests
  scripts/           deploy.js
```

## Frontend

```bash
npm install
npm run dev
```

## Blockchain

```bash
cd blockchain
npm install
npm run compile
npm run test
npm run deploy:orchard
```

Or from root: `npm run contracts:test`, `npm run contracts:deploy`

## Network

Orchard testnet — chain ID 15000, RPC https://orchard.rpc.quai.network
