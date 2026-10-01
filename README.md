# Soapy Miners

Pixel mining NFT collection on Quai Network — public mint site, miner camp, and admin tools.

## Project layout

```
soapy-miners-nft/
├── src/                 # Next.js frontend (public site + /admin)
├── public/              # Images, cursors, static assets
├── scripts/             # Frontend scripts (e.g. prepare-cursors)
├── package.json         # Frontend dependencies
│
└── blockchain/          # Smart contracts + Hardhat
    ├── contracts/       # Solidity source
    ├── test/            # Contract tests
    ├── scripts/         # Deploy scripts
    ├── hardhat.config.js
    └── package.json
```

## Frontend (main app)

From the repo root:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- `/` — The Mine (mint)
- `/collection` — My Miner Camp
- `/admin/*` — Admin panel

Copy `.env.example` to `.env.local` and set your Orchard contract address and RPC.

## Blockchain (contracts)

```bash
cd blockchain
npm install
npm run compile
npm run test
npm run deploy:orchard
```

Copy `blockchain/.env.example` to `blockchain/.env` and set `CYPRUS1_PK` and `INITIAL_OWNER`.

From the repo root you can also run:

```bash
npm run contracts:compile
npm run contracts:test
npm run contracts:deploy
```

## Network

- **Orchard testnet** — chain ID `15000`, RPC `https://orchard.rpc.quai.network`
