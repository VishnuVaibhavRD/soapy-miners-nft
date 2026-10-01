require("dotenv").config();

const fs = require("fs");
const path = require("path");

const hre = require("hardhat");
const { quais } = require("quais");

const SoapyMinersArtifact = require(
  "../artifacts/contracts/SoapyMiners.sol/SoapyMiners.json"
);

async function main() {
  const privateKey =
    process.env.CYPRUS1_PK;

  const initialOwner =
    process.env.INITIAL_OWNER;

  const networkName = hre.network.name;
  const networkConfig = hre.network.config;

  const rpcUrl =
    networkConfig.url ||
    process.env.ORCHARD_RPC_URL ||
    "https://orchard.rpc.quai.network";

  const chainId =
    networkConfig.chainId ||
    Number(process.env.ORCHARD_CHAIN_ID || 15000);

  if (!privateKey) {
    throw new Error(
      "CYPRUS1_PK is missing from .env"
    );
  }

  if (!initialOwner) {
    throw new Error(
      "INITIAL_OWNER is missing from .env"
    );
  }

  if (networkName === "cyprus1") {
    console.warn("");
    console.warn(
      "WARNING: You are deploying to Quai MAINNET (cyprus1)."
    );
    console.warn(
      "For development, use: npx hardhat run scripts/deploy.js --network orchard"
    );
    console.warn("");
  }

  // --------------------------------------------------
  // PROVIDER
  // --------------------------------------------------

  const provider =
    new quais.JsonRpcProvider(
      rpcUrl,
      undefined,
      {
        usePathing: true,
      }
    );

  // --------------------------------------------------
  // DEPLOYER WALLET
  // --------------------------------------------------

  const wallet =
    new quais.Wallet(
      privateKey,
      provider
    );

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "SOAPPY MINERS DEPLOYMENT"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Deployer: ${wallet.address}`
  );

  const balance =
    await provider.getBalance(
      wallet.address
    );

  console.log(
    `Balance: ${quais.formatQuai(balance)} QUAI`
  );

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 QUAI on Orchard. Fund it from https://orchard.faucet.quai.network"
    );
  }

  console.log(
    `Initial Owner: ${initialOwner}`
  );

  console.log(
    `Network: ${networkName}`
  );

  console.log(
    `RPC: ${rpcUrl}`
  );

  console.log(
    `Chain ID: ${chainId}`
  );

  console.log(
    "Collection: Soapy Miners"
  );

  console.log(
    "Symbol: SM"
  );

  console.log(
    "Max Supply: 256"
  );

  console.log(
    "Royalty: 3%"
  );

  console.log(
    "========================================"
  );

  // --------------------------------------------------
  // CONTRACT FACTORY
  // --------------------------------------------------

  console.log("");
  console.log(
    "Uploading contract metadata to Quai IPFS..."
  );

  const ipfsHash =
    await hre.deployMetadata.pushMetadataToIPFS(
      "SoapyMiners"
    );

  if (!ipfsHash || ipfsHash.length !== 46) {
    throw new Error(
      "Failed to obtain a valid IPFS hash for deployment metadata."
    );
  }

  console.log(
    `Metadata IPFS hash: ${ipfsHash}`
  );

  const factory =
    new quais.ContractFactory(
      SoapyMinersArtifact.abi,
      SoapyMinersArtifact.bytecode,
      wallet,
      ipfsHash
    );

  // initialOwner also receives royalties initially.
  const royaltyReceiver =
    initialOwner;

  console.log("");
  console.log(
    "Deploying contract..."
  );

  const contract =
    await factory.deploy(
      initialOwner,
      royaltyReceiver
    );

  const deploymentTransaction =
    contract.deploymentTransaction();

  if (deploymentTransaction) {
    console.log("");
    console.log(
      `Transaction broadcasted: ${deploymentTransaction.hash}`
    );
  }

  console.log("");
  console.log(
    "Waiting for deployment..."
  );

  await contract.waitForDeployment();

  const contractAddress =
    await contract.getAddress();

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "DEPLOYMENT SUCCESSFUL"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Contract Address: ${contractAddress}`
  );

  console.log(
    `Owner: ${initialOwner}`
  );

  console.log(
    "========================================"
  );

  // --------------------------------------------------
  // SAVE DEPLOYMENT
  // --------------------------------------------------

  const deploymentDirectory =
    path.join(
      process.cwd(),
      "deployment"
    );

  fs.mkdirSync(
    deploymentDirectory,
    {
      recursive: true,
    }
  );

  const deploymentData = {
    network: networkName,
    chainId,

    contract:
      "SoapyMiners",

    address:
      contractAddress,

    owner:
      initialOwner,

    royaltyReceiver:
      royaltyReceiver,

    maxSupply: 256,
    publicAllocation: 235,
    reservedAllocation: 21,

    initialMintPrice:
      "50 QUAI",

    royalty:
      "3%",

    deploymentTransaction:
      deploymentTransaction?.hash || null,

    metadataIpfsHash:
      ipfsHash,

    deployedAt:
      new Date().toISOString(),
  };

  const deploymentFile =
    path.join(
      deploymentDirectory,
      `${networkName}.json`
    );

  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(
      deploymentData,
      null,
      2
    )
  );

  console.log("");
  console.log(
    `Deployment saved to: ${deploymentFile}`
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error(
      "Deployment failed:"
    );

    console.error(error);

    process.exit(1);
  });
