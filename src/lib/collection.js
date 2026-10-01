import { fetchIpfsJson } from "@/lib/ipfs";

const BATCH_SIZE = 32;
const MAX_TOKEN_ID = 256;

export function getMinerStatus({
  metadataURI,
  available,
  minted,
}) {
  if (!metadataURI) {
    return "UNREGISTERED";
  }

  if (minted) {
    return "MINTED";
  }

  if (available) {
    return "AVAILABLE";
  }

  return "REGISTERED";
}

async function readToken(
  contract,
  tokenId
) {
  try {
    const nft =
      await contract.getNFT(
        tokenId
      );

    const metadataURI =
      nft[0];

    const available =
      nft[1];

    const minted =
      nft[2];

    const status =
      getMinerStatus({
        metadataURI,
        available,
        minted,
      });

    return {
      tokenId,
      metadataURI,
      available,
      minted,
      status,
      metadata: null,
    };
  } catch {
    return {
      tokenId,
      metadataURI: "",
      available: false,
      minted: false,
      status: "UNREGISTERED",
      metadata: null,
    };
  }
}

async function attachMetadata(
  token
) {
  if (!token.metadataURI) {
    return token;
  }

  try {
    const metadata =
      await fetchIpfsJson(
        token.metadataURI
      );

    return {
      ...token,
      metadata,
    };
  } catch {
    return token;
  }
}

export async function scanAllMiners(
  contract,
  {
    onBatch,
    fetchMetadata = false,
    registeredOnly = false,
  } = {}
) {
  const results = [];

  for (
    let start = 1;
    start <= MAX_TOKEN_ID;
    start += BATCH_SIZE
  ) {
    const batchIds =
      Array.from(
        {
          length: Math.min(
            BATCH_SIZE,
            MAX_TOKEN_ID -
              start +
              1
          ),
        },
        (_, index) =>
          start + index
      );

    let batchTokens =
      await Promise.all(
        batchIds.map(
          (tokenId) =>
            readToken(
              contract,
              tokenId
            )
        )
      );

    if (registeredOnly) {
      batchTokens =
        batchTokens.filter(
          (token) =>
            token.status !==
            "UNREGISTERED"
        );
    }

    if (
      fetchMetadata &&
      batchTokens.length > 0
    ) {
      batchTokens =
        await Promise.all(
          batchTokens.map(
            attachMetadata
          )
        );
    }

    results.push(
      ...batchTokens
    );

    if (onBatch) {
      onBatch([
        ...results,
      ]);
    }
  }

  return results;
}

export function summarizeCollection(
  miners
) {
  const registered =
    miners.filter(
      (miner) =>
        miner.status !==
        "UNREGISTERED"
    );

  return {
    registered:
      registered.length,
    available:
      miners.filter(
        (miner) =>
          miner.status ===
          "AVAILABLE"
      ).length,
    minted:
      miners.filter(
        (miner) =>
          miner.status ===
          "MINTED"
      ).length,
    pendingRelease:
      miners.filter(
        (miner) =>
          miner.status ===
          "REGISTERED"
      ).length,
  };
}

async function readAvailableToken(
  contract,
  tokenId
) {
  try {
    const nft =
      await contract.getNFT(
        tokenId
      );

    const metadataURI =
      nft[0];

    const available =
      nft[1];

    const mintedAlready =
      nft[2];

    if (
      !metadataURI ||
      !available ||
      mintedAlready
    ) {
      return null;
    }

    return {
      tokenId,
      metadataURI,
      metadata: null,
    };
  } catch {
    return null;
  }
}

export async function loadAvailableMiners(
  contract,
  { onBatch } = {}
) {
  const results = [];

  for (
    let start = 1;
    start <= MAX_TOKEN_ID;
    start += BATCH_SIZE
  ) {
    const batchIds =
      Array.from(
        {
          length: Math.min(
            BATCH_SIZE,
            MAX_TOKEN_ID -
              start +
              1
          ),
        },
        (_, index) =>
          start + index
      );

    const batchTokens =
      (
        await Promise.all(
          batchIds.map(
            (tokenId) =>
              readAvailableToken(
                contract,
                tokenId
              )
          )
        )
      ).filter(Boolean);

    if (batchTokens.length > 0) {
      const withMetadata =
        await Promise.all(
          batchTokens.map(
            attachMetadata
          )
        );

      results.push(
        ...withMetadata
      );
    }

    if (onBatch) {
      onBatch([
        ...results,
      ]);
    }
  }

  return results;
}

export async function loadOwnedMiners(
  contract,
  userAddress,
  { onBatch } = {}
) {
  const normalizedAddress =
    userAddress.toLowerCase();

  const balance =
    await contract.balanceOf(
      userAddress
    );

  if (Number(balance) === 0) {
    if (onBatch) {
      onBatch([]);
    }

    return [];
  }

  const owned = [];

  for (
    let start = 1;
    start <= MAX_TOKEN_ID;
    start += BATCH_SIZE
  ) {
    const batchIds =
      Array.from(
        {
          length: Math.min(
            BATCH_SIZE,
            MAX_TOKEN_ID -
              start +
              1
          ),
        },
        (_, index) =>
          start + index
      );

    const batchOwned =
      (
        await Promise.all(
          batchIds.map(
            async (tokenId) => {
              try {
                const owner =
                  await contract.ownerOf(
                    tokenId
                  );

                if (
                  owner.toLowerCase() !==
                  normalizedAddress
                ) {
                  return null;
                }

                const nft =
                  await contract.getNFT(
                    tokenId
                  );

                return {
                  tokenId,
                  metadataURI:
                    nft[0],
                  metadata: null,
                };
              } catch {
                return null;
              }
            }
          )
        )
      ).filter(Boolean);

    if (batchOwned.length > 0) {
      const withMetadata =
        await Promise.all(
          batchOwned.map(
            attachMetadata
          )
        );

      owned.push(
        ...withMetadata
      );

      if (onBatch) {
        onBatch([
          ...owned,
        ]);
      }
    }
  }

  return owned.sort(
    (a, b) =>
      a.tokenId - b.tokenId
  );
}

export async function loadDashboardStats(
  contract
) {
  const [
    maxSupply,
    publicAllocation,
    reservedAllocation,
    rawPrice,
    mintEnabled,
    totalMinted,
    publicMinted,
    reservedMinted,
  ] =
    await Promise.all([
      contract.MAX_SUPPLY(),
      contract.PUBLIC_ALLOCATION(),
      contract.RESERVED_ALLOCATION(),
      contract.mintPrice(),
      contract.publicMintEnabled(),
      contract.totalMinted(),
      contract.publicMinted(),
      contract.reservedMinted(),
    ]);

  const miners =
    await scanAllMiners(
      contract
    );

  const summary =
    summarizeCollection(
      miners
    );

  const contractAddress =
    await contract.getAddress();

  const rawBalance =
    await contract.runner.getBalance(
      contractAddress
    );

  return {
    maxSupply: Number(
      maxSupply
    ),
    publicAllocation: Number(
      publicAllocation
    ),
    reservedAllocation: Number(
      reservedAllocation
    ),
    mintPrice: rawPrice,
    mintEnabled,
    totalMinted: Number(
      totalMinted
    ),
    publicMinted: Number(
      publicMinted
    ),
    reservedMinted: Number(
      reservedMinted
    ),
    contractBalance: rawBalance,
    ...summary,
  };
}
