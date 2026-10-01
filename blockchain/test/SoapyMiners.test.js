const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SoapyMiners", function () {
  let soapyMiners;

  let owner;
  let user1;
  let user2;
  let royaltyReceiver;

  const INITIAL_PRICE = ethers.parseEther("50");
  const RESERVED_TOKEN_START = 236;
  const RESERVED_TOKEN_END = 256;

  async function registerNFT(
    nftId,
    uri = `ipfs://soapy-metadata-${nftId}`
  ) {
    await soapyMiners.registerNFT(nftId, uri);
  }

  async function registerReservedNFT(
    nftId,
    uri = `ipfs://reserved-metadata-${nftId}`
  ) {
    await soapyMiners.registerReservedNFT(
      nftId,
      uri
    );
  }

  async function batchRegisterAndRelease(
    ids,
    uris,
    price = INITIAL_PRICE
  ) {
    await soapyMiners.registerAndReleaseBatch(
      ids,
      uris,
      price
    );
  }

  async function makeAvailable(nftId) {
    await soapyMiners.setNFTAvailability(nftId, true);
  }

  beforeEach(async function () {
    [owner, user1, user2, royaltyReceiver] =
      await ethers.getSigners();

    const SoapyMiners =
      await ethers.getContractFactory("SoapyMiners");

    soapyMiners = await SoapyMiners.deploy(
      owner.address,
      royaltyReceiver.address
    );

    await soapyMiners.waitForDeployment();
  });

  // ------------------------------------------------------------
  // DEPLOYMENT
  // ------------------------------------------------------------

  describe("Deployment", function () {
    it("sets the correct collection name", async function () {
      expect(
        await soapyMiners.name()
      ).to.equal("Soapy Miners");
    });

    it("sets the correct collection symbol", async function () {
      expect(
        await soapyMiners.symbol()
      ).to.equal("SM");
    });

    it("sets max supply to 256", async function () {
      expect(
        await soapyMiners.MAX_SUPPLY()
      ).to.equal(256n);
    });

    it("sets public allocation to 235", async function () {
      expect(
        await soapyMiners.PUBLIC_ALLOCATION()
      ).to.equal(235n);
    });

    it("sets reserved allocation to 21", async function () {
      expect(
        await soapyMiners.RESERVED_ALLOCATION()
      ).to.equal(21n);
    });

    it("sets starting mint price to 50 QUAI", async function () {
      expect(
        await soapyMiners.mintPrice()
      ).to.equal(INITIAL_PRICE);
    });

    it("starts public mint disabled", async function () {
      expect(
        await soapyMiners.publicMintEnabled()
      ).to.equal(false);
    });

    it("sets the correct owner", async function () {
      expect(
        await soapyMiners.owner()
      ).to.equal(owner.address);
    });
  });

  // ------------------------------------------------------------
  // ROYALTIES
  // ------------------------------------------------------------

  describe("Royalty", function () {
    it("returns a 3 percent royalty", async function () {
      const salePrice =
        ethers.parseEther("100");

      const [receiver, royaltyAmount] =
        await soapyMiners.royaltyInfo(
          1,
          salePrice
        );

      expect(receiver).to.equal(
        royaltyReceiver.address
      );

      expect(royaltyAmount).to.equal(
        ethers.parseEther("3")
      );
    });

    it("allows owner to change royalty receiver", async function () {
      await soapyMiners.setRoyaltyReceiver(
        user1.address
      );

      const [receiver] =
        await soapyMiners.royaltyInfo(
          1,
          ethers.parseEther("100")
        );

      expect(receiver).to.equal(
        user1.address
      );
    });

    it("blocks non-owner from changing royalty receiver", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .setRoyaltyReceiver(
            user2.address
          )
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  // ------------------------------------------------------------
  // NFT REGISTRATION
  // ------------------------------------------------------------

  describe("NFT Registration", function () {
    it("allows owner to register an NFT", async function () {
      await registerNFT(
        1,
        "ipfs://unique-soapy-1"
      );

      const nft =
        await soapyMiners.getNFT(1);

      expect(nft[0]).to.equal(
        "ipfs://unique-soapy-1"
      );

      expect(nft[1]).to.equal(false);
      expect(nft[2]).to.equal(false);
    });

    it("rejects token ID zero", async function () {
      await expect(
        soapyMiners.registerNFT(
          0,
          "ipfs://invalid"
        )
      ).to.be.revertedWith(
        "Invalid public NFT ID"
      );
    });

    it("rejects reserved IDs via public registration", async function () {
      await expect(
        soapyMiners.registerNFT(
          236,
          "ipfs://reserved"
        )
      ).to.be.revertedWith(
        "Invalid public NFT ID"
      );
    });

    it("rejects IDs above public range", async function () {
      await expect(
        soapyMiners.registerNFT(
          257,
          "ipfs://invalid"
        )
      ).to.be.revertedWith(
        "Invalid public NFT ID"
      );
    });

    it("rejects empty metadata URI", async function () {
      await expect(
        soapyMiners.registerNFT(
          1,
          ""
        )
      ).to.be.revertedWith(
        "Metadata URI required"
      );
    });

    it("does not allow an NFT ID to be registered twice", async function () {
      await registerNFT(
        1,
        "ipfs://soapy-one"
      );

      await expect(
        soapyMiners.registerNFT(
          1,
          "ipfs://different-uri"
        )
      ).to.be.revertedWith(
        "NFT already registered"
      );
    });

    it("does not allow the same IPFS metadata URI twice", async function () {
      const uri =
        "ipfs://same-metadata-uri";

      await soapyMiners.registerNFT(
        1,
        uri
      );

      await expect(
        soapyMiners.registerNFT(
          2,
          uri
        )
      ).to.be.revertedWith(
        "Metadata already used"
      );
    });

    it("reports used metadata correctly", async function () {
      const uri =
        "ipfs://special-soapy";

      expect(
        await soapyMiners.isMetadataUsed(
          uri
        )
      ).to.equal(false);

      await soapyMiners.registerNFT(
        1,
        uri
      );

      expect(
        await soapyMiners.isMetadataUsed(
          uri
        )
      ).to.equal(true);
    });

    it("blocks non-owner from registering NFTs", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .registerNFT(
            1,
            "ipfs://hacker"
          )
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Reserved NFT Registration", function () {
    it("allows owner to register reserved NFTs", async function () {
      await registerReservedNFT(
        RESERVED_TOKEN_START,
        "ipfs://reserved-236"
      );

      const nft =
        await soapyMiners.getNFT(
          RESERVED_TOKEN_START
        );

      expect(nft[0]).to.equal(
        "ipfs://reserved-236"
      );

      expect(nft[1]).to.equal(false);
      expect(nft[2]).to.equal(false);
    });

    it("rejects public IDs via reserved registration", async function () {
      await expect(
        soapyMiners.registerReservedNFT(
          1,
          "ipfs://public"
        )
      ).to.be.revertedWith(
        "Invalid reserved NFT ID"
      );
    });

    it("rejects IDs outside reserved range", async function () {
      await expect(
        soapyMiners.registerReservedNFT(
          257,
          "ipfs://invalid"
        )
      ).to.be.revertedWith(
        "Invalid reserved NFT ID"
      );
    });
  });

  // ------------------------------------------------------------
  // AVAILABILITY
  // ------------------------------------------------------------

  describe("NFT Availability", function () {
    beforeEach(async function () {
      await registerNFT(1);
    });

    it("allows owner to make NFT available", async function () {
      await makeAvailable(1);

      const nft =
        await soapyMiners.getNFT(1);

      expect(nft[1]).to.equal(true);
    });

    it("allows owner to disable an available NFT", async function () {
      await makeAvailable(1);

      await soapyMiners.setNFTAvailability(
        1,
        false
      );

      const nft =
        await soapyMiners.getNFT(1);

      expect(nft[1]).to.equal(false);
    });

    it("blocks availability change for unregistered NFT", async function () {
      await expect(
        soapyMiners.setNFTAvailability(
          2,
          true
        )
      ).to.be.revertedWith(
        "NFT not registered"
      );
    });

    it("blocks non-owner from changing availability", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .setNFTAvailability(
            1,
            true
          )
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  // ------------------------------------------------------------
  // BATCH OPERATIONS
  // ------------------------------------------------------------

  describe("Batch Operations", function () {
    it("registers and releases multiple NFTs in one transaction", async function () {
      const ids = [1, 2, 3, 4, 5];

      const uris = [
        "ipfs://batch-1",
        "ipfs://batch-2",
        "ipfs://batch-3",
        "ipfs://batch-4",
        "ipfs://batch-5",
      ];

      await batchRegisterAndRelease(
        ids,
        uris
      );

      for (
        let i = 0;
        i < ids.length;
        i++
      ) {
        const nft =
          await soapyMiners.getNFT(
            ids[i]
          );

        expect(
          nft[0]
        ).to.equal(
          uris[i]
        );

        expect(
          nft[1]
        ).to.equal(true);

        expect(
          nft[2]
        ).to.equal(false);
      }
    });

    it("rejects different array lengths", async function () {
      await expect(
        soapyMiners.registerAndReleaseBatch(
          [1, 2],
          ["ipfs://only-one"],
          INITIAL_PRICE
        )
      ).to.be.revertedWith(
        "Length mismatch"
      );
    });

    it("rejects duplicate metadata inside a batch", async function () {
      await expect(
        soapyMiners.registerAndReleaseBatch(
          [1, 2],
          [
            "ipfs://duplicate",
            "ipfs://duplicate",
          ],
          INITIAL_PRICE
        )
      ).to.be.revertedWith(
        "Metadata already used"
      );

      const nft1 =
        await soapyMiners.getNFT(1);

      expect(
        nft1[0]
      ).to.equal("");
    });

    it("rejects batch greater than 50 NFTs", async function () {
      const ids = [];
      const uris = [];

      for (
        let i = 1;
        i <= 51;
        i++
      ) {
        ids.push(i);

        uris.push(
          `ipfs://batch-${i}`
        );
      }

      await expect(
        soapyMiners.registerAndReleaseBatch(
          ids,
          uris,
          INITIAL_PRICE
        )
      ).to.be.revertedWith(
        "Batch too large"
      );
    });

    it("can disable multiple NFTs together", async function () {
      await batchRegisterAndRelease(
        [1, 2, 3],
        [
          "ipfs://one",
          "ipfs://two",
          "ipfs://three",
        ]
      );

      await soapyMiners.setNFTAvailabilityBatch(
        [1, 2, 3],
        false
      );

      for (
        const id of [1, 2, 3]
      ) {
        const nft =
          await soapyMiners.getNFT(
            id
          );

        expect(
          nft[1]
        ).to.equal(false);
      }
    });

    it("blocks non-owner batch registration", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .registerAndReleaseBatch(
            [1],
            ["ipfs://bad"],
            INITIAL_PRICE
          )
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });

    it("rejects reserved token IDs in public batch", async function () {
      await expect(
        soapyMiners.registerAndReleaseBatch(
          [236],
          ["ipfs://reserved-batch"],
          INITIAL_PRICE
        )
      ).to.be.revertedWith(
        "Invalid public NFT ID"
      );
    });

    it("rejects empty batches", async function () {
      await expect(
        soapyMiners.registerAndReleaseBatch(
          [],
          [],
          INITIAL_PRICE
        )
      ).to.be.revertedWith(
        "Empty batch"
      );
    });

    it("reverts the entire batch when an NFT is already registered", async function () {
      await registerNFT(
        1,
        "ipfs://existing-soapy"
      );

      await expect(
        soapyMiners.registerAndReleaseBatch(
          [1, 2],
          [
            "ipfs://new-uri-1",
            "ipfs://new-uri-2",
          ],
          INITIAL_PRICE
        )
      ).to.be.revertedWith(
        "NFT already registered"
      );

      const nft2 =
        await soapyMiners.getNFT(2);

      expect(nft2[0]).to.equal("");
    });

    it("reverts availability batch for minted NFTs", async function () {
      await batchRegisterAndRelease(
        [1],
        ["ipfs://minted-batch"]
      );

      await soapyMiners.setPublicMintEnabled(
        true
      );

      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      await expect(
        soapyMiners.setNFTAvailabilityBatch(
          [1],
          true
        )
      ).to.be.revertedWith(
        "NFT already minted"
      );
    });

    it("rejects zero batch release price", async function () {
      await expect(
        soapyMiners.registerAndReleaseBatch(
          [1],
          ["ipfs://batch-price"],
          0
        )
      ).to.be.revertedWith(
        "Price must be greater than zero"
      );
    });

    it("updates mint price during batch release", async function () {
      const newPrice =
        ethers.parseEther("65");

      await soapyMiners.registerAndReleaseBatch(
        [1],
        ["ipfs://priced-batch"],
        newPrice
      );

      expect(
        await soapyMiners.mintPrice()
      ).to.equal(newPrice);
    });

    it("advances nextPublicTokenId after mint", async function () {
      await batchRegisterAndRelease(
        [1, 2],
        [
          "ipfs://seq-1",
          "ipfs://seq-2",
        ]
      );

      await soapyMiners.setPublicMintEnabled(
        true
      );

      expect(
        await soapyMiners.nextPublicTokenId()
      ).to.equal(1n);

      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      expect(
        await soapyMiners.nextPublicTokenId()
      ).to.equal(2n);
    });
  });

  // ------------------------------------------------------------
  // PUBLIC MINT CONTROL
  // ------------------------------------------------------------

  describe("Public Mint Control", function () {
    it("allows owner to enable public mint", async function () {
      await soapyMiners.setPublicMintEnabled(
        true
      );

      expect(
        await soapyMiners.publicMintEnabled()
      ).to.equal(true);
    });

    it("blocks non-owner from controlling public mint", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .setPublicMintEnabled(true)
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  // ------------------------------------------------------------
  // PUBLIC MINTING
  // ------------------------------------------------------------

  describe("Public Minting", function () {
    beforeEach(async function () {
      await registerNFT(1);
      await makeAvailable(1);

      await soapyMiners.setPublicMintEnabled(
        true
      );
    });

    it("allows user to mint an available NFT", async function () {
      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      expect(
        await soapyMiners.ownerOf(1)
      ).to.equal(user1.address);

      expect(
        await soapyMiners.tokenURI(1)
      ).to.equal(
        "ipfs://soapy-metadata-1"
      );
    });

    it("increments supply counters after public mint", async function () {
      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      expect(
        await soapyMiners.totalMinted()
      ).to.equal(1n);

      expect(
        await soapyMiners.publicMinted()
      ).to.equal(1n);

      expect(
        await soapyMiners.reservedMinted()
      ).to.equal(0n);
    });

    it("marks NFT as minted and unavailable", async function () {
      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      const nft =
        await soapyMiners.getNFT(1);

      expect(nft[1]).to.equal(false);
      expect(nft[2]).to.equal(true);
    });

    it("rejects incorrect QUAI payment", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .mint({
            value:
              ethers.parseEther("49"),
          })
      ).to.be.revertedWith(
        "Incorrect QUAI amount"
      );
    });

    it("rejects overpayment too", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .mint({
            value:
              ethers.parseEther("51"),
          })
      ).to.be.revertedWith(
        "Incorrect QUAI amount"
      );
    });

    it("does not allow unavailable NFT to be minted", async function () {
      await registerNFT(2);
      await makeAvailable(2);

      await soapyMiners.setNFTAvailability(
        1,
        false
      );

      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      expect(
        await soapyMiners.ownerOf(2)
      ).to.equal(user1.address);
    });

    it("mints sequentially through the public range", async function () {
      await registerNFT(2);
      await makeAvailable(2);

      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      await soapyMiners
        .connect(user2)
        .mint({
          value: INITIAL_PRICE,
        });

      expect(
        await soapyMiners.ownerOf(1)
      ).to.equal(user1.address);

      expect(
        await soapyMiners.ownerOf(2)
      ).to.equal(user2.address);
    });

    it("does not allow minting when no public NFTs are available", async function () {
      await soapyMiners.setNFTAvailability(
        1,
        false
      );

      await expect(
        soapyMiners
          .connect(user1)
          .mint({
            value: INITIAL_PRICE,
          })
      ).to.be.revertedWith(
        "No public NFTs available"
      );
    });

    it("blocks minting when public mint is disabled", async function () {
      await soapyMiners.setPublicMintEnabled(
        false
      );

      await expect(
        soapyMiners
          .connect(user1)
          .mint({
            value: INITIAL_PRICE,
          })
      ).to.be.revertedWith(
        "Public mint disabled"
      );
    });
  });

  // ------------------------------------------------------------
  // DYNAMIC PRICE
  // ------------------------------------------------------------

  describe("Dynamic Mint Price", function () {
    it("allows owner to update mint price", async function () {
      const newPrice =
        ethers.parseEther("75");

      await soapyMiners.setMintPrice(
        newPrice
      );

      expect(
        await soapyMiners.mintPrice()
      ).to.equal(newPrice);
    });

    it("new mint price applies to future mint", async function () {
      await registerNFT(1);
      await makeAvailable(1);

      await soapyMiners.setPublicMintEnabled(
        true
      );

      const newPrice =
        ethers.parseEther("75");

      await soapyMiners.setMintPrice(
        newPrice
      );

      await expect(
        soapyMiners
          .connect(user1)
          .mint({
            value: INITIAL_PRICE,
          })
      ).to.be.revertedWith(
        "Incorrect QUAI amount"
      );

      await soapyMiners
        .connect(user1)
        .mint({
          value: newPrice,
        });

      expect(
        await soapyMiners.ownerOf(1)
      ).to.equal(user1.address);
    });

    it("blocks non-owner price change", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .setMintPrice(
            ethers.parseEther("1")
          )
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });

    it("does not allow zero mint price", async function () {
      await expect(
        soapyMiners.setMintPrice(0)
      ).to.be.revertedWith(
        "Price must be greater than zero"
      );
    });
  });

  // ------------------------------------------------------------
  // RESERVED MINTING
  // ------------------------------------------------------------

  describe("Reserved Minting", function () {
    it("allows owner to reserved-mint registered NFT", async function () {
      await registerReservedNFT(
        RESERVED_TOKEN_START
      );

      await soapyMiners.reservedMint(
        user1.address,
        RESERVED_TOKEN_START
      );

      expect(
        await soapyMiners.ownerOf(
          RESERVED_TOKEN_START
        )
      ).to.equal(user1.address);

      expect(
        await soapyMiners.reservedMinted()
      ).to.equal(1n);

      expect(
        await soapyMiners.totalMinted()
      ).to.equal(1n);
    });

    it("reserved NFT does not need public availability", async function () {
      await registerReservedNFT(
        RESERVED_TOKEN_START
      );

      const nftBefore =
        await soapyMiners.getNFT(
          RESERVED_TOKEN_START
        );

      expect(nftBefore[1]).to.equal(
        false
      );

      await soapyMiners.reservedMint(
        user1.address,
        RESERVED_TOKEN_START
      );

      expect(
        await soapyMiners.ownerOf(
          RESERVED_TOKEN_START
        )
      ).to.equal(user1.address);
    });

    it("rejects reserved mint for public token IDs", async function () {
      await registerNFT(1);

      await expect(
        soapyMiners.reservedMint(
          user1.address,
          1
        )
      ).to.be.revertedWith(
        "Invalid reserved NFT ID"
      );
    });

    it("blocks non-owner reserved minting", async function () {
      await registerReservedNFT(
        RESERVED_TOKEN_START
      );

      await expect(
        soapyMiners
          .connect(user1)
          .reservedMint(
            user1.address,
            RESERVED_TOKEN_START
          )
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });

    it("enforces the 21 NFT reserved allocation", async function () {
      for (
        let nftId = RESERVED_TOKEN_START;
        nftId <= RESERVED_TOKEN_END;
        nftId++
      ) {
        await registerReservedNFT(nftId);
      }

      for (
        let nftId = RESERVED_TOKEN_START;
        nftId <= RESERVED_TOKEN_END;
        nftId++
      ) {
        await soapyMiners.reservedMint(
          user1.address,
          nftId
        );
      }

      expect(
        await soapyMiners.reservedMinted()
      ).to.equal(21n);

      await expect(
        soapyMiners.reservedMint(
          user1.address,
          RESERVED_TOKEN_START
        )
      ).to.be.revertedWith(
        "Reserved allocation exhausted"
      );
    });
  });

  // ------------------------------------------------------------
  // SUPPLY HELPERS
  // ------------------------------------------------------------

  describe("Supply Functions", function () {
    it("reports remaining public supply", async function () {
      expect(
        await soapyMiners.remainingPublicSupply()
      ).to.equal(235n);
    });

    it("reports remaining reserved supply", async function () {
      expect(
        await soapyMiners.remainingReservedSupply()
      ).to.equal(21n);
    });

    it("updates remaining public supply after mint", async function () {
      await registerNFT(1);
      await makeAvailable(1);

      await soapyMiners.setPublicMintEnabled(
        true
      );

      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });

      expect(
        await soapyMiners.remainingPublicSupply()
      ).to.equal(234n);
    });
  });

  // ------------------------------------------------------------
  // WITHDRAWAL
  // ------------------------------------------------------------

  describe("Withdrawal", function () {
    beforeEach(async function () {
      await registerNFT(1);
      await makeAvailable(1);

      await soapyMiners.setPublicMintEnabled(
        true
      );

      await soapyMiners
        .connect(user1)
        .mint({
          value: INITIAL_PRICE,
        });
    });

    it("holds mint revenue in the contract", async function () {
      const contractAddress =
        await soapyMiners.getAddress();

      const balance =
        await ethers.provider.getBalance(
          contractAddress
        );

      expect(balance).to.equal(
        INITIAL_PRICE
      );
    });

    it("allows owner to withdraw contract funds", async function () {
      const contractAddress =
        await soapyMiners.getAddress();

      await soapyMiners.withdraw();

      const balanceAfter =
        await ethers.provider.getBalance(
          contractAddress
        );

      expect(balanceAfter).to.equal(0n);
    });

    it("blocks non-owner withdrawal", async function () {
      await expect(
        soapyMiners
          .connect(user1)
          .withdraw()
      ).to.be.revertedWithCustomError(
        soapyMiners,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});
