// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoapyMiners is ERC721URIStorage, ERC2981, Ownable {

    // ------------------------------------------------------------
    // COLLECTION CONFIGURATION
    // ------------------------------------------------------------

    uint256 public constant MAX_SUPPLY = 256;
    uint256 public constant PUBLIC_ALLOCATION = 235;
    uint256 public constant RESERVED_ALLOCATION = 21;

    uint256 public constant FIRST_PUBLIC_TOKEN_ID = 1;
    uint256 public constant LAST_PUBLIC_TOKEN_ID = 235;
    uint256 public constant FIRST_RESERVED_TOKEN_ID = 236;
    uint256 public constant LAST_RESERVED_TOKEN_ID = 256;

    uint256 public totalMinted;
    uint256 public publicMinted;
    uint256 public reservedMinted;

    uint256 public mintPrice = 50 ether;

    bool public publicMintEnabled;

    uint256 public nextPublicTokenId = 1;

    // ------------------------------------------------------------
    // NFT REGISTRATION
    // ------------------------------------------------------------

    struct NFTData {
        string metadataURI;
        bool available;
        bool minted;
    }

    // NFT ID => NFT information
    mapping(uint256 => NFTData) private nftData;

    // Prevent the same metadata URI from being registered twice.
    mapping(bytes32 => bool) private usedMetadata;

    // ------------------------------------------------------------
    // EVENTS
    // ------------------------------------------------------------

    event NFTRegistered(
        uint256 indexed nftId,
        string metadataURI
    );

    event NFTAvailabilityChanged(
        uint256 indexed nftId,
        bool available
    );

    event PublicMinted(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 price
    );

    event ReservedMinted(
        address indexed recipient,
        uint256 indexed tokenId
    );

    event MintPriceUpdated(
        uint256 oldPrice,
        uint256 newPrice
    );

    event PublicMintStatusUpdated(
        bool enabled
    );

    event FundsWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    // ------------------------------------------------------------
    // CONSTRUCTOR
    // ------------------------------------------------------------

    constructor(
        address initialOwner,
        address royaltyReceiver
    )
        ERC721("Soapy Miners", "SM")
        Ownable(initialOwner)
    {
        require(
            initialOwner != address(0),
            "Invalid owner"
        );

        require(
            royaltyReceiver != address(0),
            "Invalid royalty receiver"
        );

        // 300 basis points = 3%
        _setDefaultRoyalty(royaltyReceiver, 300);
    }

    // ------------------------------------------------------------
    // INTERNAL — REGISTER NFT
    // ------------------------------------------------------------

    function _registerNFT(
        uint256 nftId,
        string calldata metadataURI,
        bool available
    )
        internal
    {
        require(
            bytes(metadataURI).length > 0,
            "Metadata URI required"
        );

        require(
            bytes(
                nftData[nftId].metadataURI
            ).length == 0,
            "NFT already registered"
        );

        bytes32 metadataHash =
            keccak256(
                bytes(metadataURI)
            );

        require(
            !usedMetadata[
                metadataHash
            ],
            "Metadata already used"
        );

        nftData[nftId] =
            NFTData({
                metadataURI:
                    metadataURI,
                available:
                    available,
                minted:
                    false
            });

        usedMetadata[
            metadataHash
        ] = true;

        emit NFTRegistered(
            nftId,
            metadataURI
        );

        if (available) {
            emit NFTAvailabilityChanged(
                nftId,
                true
            );
        }
    }

    // ------------------------------------------------------------
    // ADMIN — REGISTER NFT
    // ------------------------------------------------------------

    function registerNFT(
        uint256 nftId,
        string calldata metadataURI
    )
        external
        onlyOwner
    {
        require(
            nftId >= FIRST_PUBLIC_TOKEN_ID &&
            nftId <= LAST_PUBLIC_TOKEN_ID,
            "Invalid public NFT ID"
        );

        _registerNFT(
            nftId,
            metadataURI,
            false
        );
    }

    function registerReservedNFT(
        uint256 nftId,
        string calldata metadataURI
    )
        external
        onlyOwner
    {
        require(
            nftId >= FIRST_RESERVED_TOKEN_ID &&
            nftId <= LAST_RESERVED_TOKEN_ID,
            "Invalid reserved NFT ID"
        );

        _registerNFT(
            nftId,
            metadataURI,
            false
        );
    }

    // ------------------------------------------------------------
    // ADMIN — RELEASE NFT
    // ------------------------------------------------------------

    function setNFTAvailability(
        uint256 nftId,
        bool available
    )
        external
        onlyOwner
    {
        NFTData storage data = nftData[nftId];

        require(
            nftId >= FIRST_PUBLIC_TOKEN_ID &&
            nftId <= LAST_PUBLIC_TOKEN_ID,
            "Invalid public NFT ID"
        );

        require(
            bytes(data.metadataURI).length > 0,
            "NFT not registered"
        );

        require(
            !data.minted,
            "NFT already minted"
        );

        data.available = available;

        emit NFTAvailabilityChanged(
            nftId,
            available
        );
    }

    // ------------------------------------------------------------
    // ADMIN — BATCH REGISTER + RELEASE
    // ------------------------------------------------------------

    function registerAndReleaseBatch(
        uint256[] calldata nftIds,
        string[] calldata metadataURIs,
        uint256 newMintPrice
    )
        external
        onlyOwner
    {
        require(
            nftIds.length > 0,
            "Empty batch"
        );

        require(
            nftIds.length ==
            metadataURIs.length,
            "Length mismatch"
        );

        require(
            nftIds.length <= 50,
            "Batch too large"
        );

        require(
            newMintPrice > 0,
            "Price must be greater than zero"
        );

        uint256 oldPrice =
            mintPrice;

        mintPrice =
            newMintPrice;

        for (
            uint256 i = 0;
            i < nftIds.length;
            i++
        ) {
            require(
                nftIds[i] >=
                    FIRST_PUBLIC_TOKEN_ID &&
                nftIds[i] <=
                    LAST_PUBLIC_TOKEN_ID,
                "Invalid public NFT ID"
            );

            _registerNFT(
                nftIds[i],
                metadataURIs[i],
                true
            );
        }

        emit MintPriceUpdated(
            oldPrice,
            newMintPrice
        );
    }

    function setNFTAvailabilityBatch(
        uint256[] calldata nftIds,
        bool available
    )
        external
        onlyOwner
    {
        require(
            nftIds.length > 0,
            "Empty batch"
        );

        require(
            nftIds.length <= 50,
            "Batch too large"
        );

        for (
            uint256 i = 0;
            i < nftIds.length;
            i++
        ) {
            uint256 nftId = nftIds[i];

            NFTData storage data =
                nftData[nftId];

            require(
                nftId >= FIRST_PUBLIC_TOKEN_ID &&
                nftId <= LAST_PUBLIC_TOKEN_ID,
                "Invalid public NFT ID"
            );

            require(
                bytes(data.metadataURI).length > 0,
                "NFT not registered"
            );

            require(
                !data.minted,
                "NFT already minted"
            );

            data.available = available;

            emit NFTAvailabilityChanged(
                nftId,
                available
            );
        }
    }

    // ------------------------------------------------------------
    // PUBLIC MINT
    // ------------------------------------------------------------

    function _findNextPublicToken()
        internal
        view
        returns (uint256)
    {
        for (
            uint256 tokenId = nextPublicTokenId;
            tokenId <= LAST_PUBLIC_TOKEN_ID;
            tokenId++
        ) {
            NFTData memory data =
                nftData[tokenId];

            if (
                bytes(data.metadataURI).length > 0 &&
                data.available &&
                !data.minted
            ) {
                return tokenId;
            }
        }

        revert(
            "No public NFTs available"
        );
    }

    function mint()
        external
        payable
    {
        require(
            publicMintEnabled,
            "Public mint disabled"
        );

        require(
            publicMinted <
            PUBLIC_ALLOCATION,
            "Public allocation exhausted"
        );

        require(
            msg.value == mintPrice,
            "Incorrect QUAI amount"
        );

        uint256 tokenId =
            _findNextPublicToken();

        NFTData storage data =
            nftData[tokenId];

        data.minted = true;
        data.available = false;

        totalMinted++;
        publicMinted++;

        nextPublicTokenId =
            tokenId + 1;

        _safeMint(msg.sender, tokenId);

        _setTokenURI(
            tokenId,
            data.metadataURI
        );

        emit PublicMinted(
            msg.sender,
            tokenId,
            msg.value
        );
    }

    // ------------------------------------------------------------
    // ADMIN RESERVED MINT
    // ------------------------------------------------------------

    function reservedMint(
        address recipient,
        uint256 nftId
    )
        external
        onlyOwner
    {
        require(
            recipient != address(0),
            "Invalid recipient"
        );

        require(
            nftId >= FIRST_RESERVED_TOKEN_ID &&
            nftId <= LAST_RESERVED_TOKEN_ID,
            "Invalid reserved NFT ID"
        );

        require(
            reservedMinted <
            RESERVED_ALLOCATION,
            "Reserved allocation exhausted"
        );

        NFTData storage data = nftData[nftId];

        require(
            bytes(data.metadataURI).length > 0,
            "NFT not registered"
        );

        require(
            !data.minted,
            "NFT already minted"
        );

        data.minted = true;
        data.available = false;

        totalMinted++;
        reservedMinted++;

        _safeMint(
            recipient,
            nftId
        );

        _setTokenURI(
            nftId,
            data.metadataURI
        );

        emit ReservedMinted(
            recipient,
            nftId
        );
    }

    // ------------------------------------------------------------
    // ADMIN — PRICE
    // ------------------------------------------------------------

    function setMintPrice(
        uint256 newPrice
    )
        external
        onlyOwner
    {
        require(
            newPrice > 0,
            "Price must be greater than zero"
        );

        uint256 oldPrice = mintPrice;

        mintPrice = newPrice;

        emit MintPriceUpdated(
            oldPrice,
            newPrice
        );
    }

    // ------------------------------------------------------------
    // ADMIN — PUBLIC MINT
    // ------------------------------------------------------------

    function setPublicMintEnabled(
        bool enabled
    )
        external
        onlyOwner
    {
        publicMintEnabled = enabled;

        emit PublicMintStatusUpdated(
            enabled
        );
    }

    // ------------------------------------------------------------
    // READ FUNCTIONS
    // ------------------------------------------------------------

    function getNFT(
        uint256 nftId
    )
        external
        view
        returns (
            string memory metadataURI,
            bool available,
            bool minted
        )
    {
        NFTData memory data = nftData[nftId];

        return (
            data.metadataURI,
            data.available,
            data.minted
        );
    }

    function isMetadataUsed(
        string calldata metadataURI
    )
        external
        view
        returns (bool)
    {
        return usedMetadata[
            keccak256(bytes(metadataURI))
        ];
    }

    function remainingPublicSupply()
        external
        view
        returns (uint256)
    {
        return PUBLIC_ALLOCATION - publicMinted;
    }

    function remainingReservedSupply()
        external
        view
        returns (uint256)
    {
        return RESERVED_ALLOCATION - reservedMinted;
    }

    function countAvailablePublic()
        external
        view
        returns (uint256)
    {
        uint256 count = 0;

        for (
            uint256 tokenId = FIRST_PUBLIC_TOKEN_ID;
            tokenId <= LAST_PUBLIC_TOKEN_ID;
            tokenId++
        ) {
            NFTData memory data =
                nftData[tokenId];

            if (
                bytes(data.metadataURI).length > 0 &&
                data.available &&
                !data.minted
            ) {
                count++;
            }
        }

        return count;
    }

    // ------------------------------------------------------------
    // ADMIN — ROYALTY
    // ------------------------------------------------------------

    function setRoyaltyReceiver(
        address receiver
    )
        external
        onlyOwner
    {
        require(
            receiver != address(0),
            "Invalid royalty receiver"
        );

        _setDefaultRoyalty(
            receiver,
            300
        );
    }

    // ------------------------------------------------------------
    // ADMIN — WITHDRAW
    // ------------------------------------------------------------

    function withdraw()
        external
        onlyOwner
    {
        uint256 balance =
            address(this).balance;

        require(
            balance > 0,
            "Nothing to withdraw"
        );

        (bool success, ) =
            payable(owner()).call{
                value: balance
            }("");

        require(
            success,
            "Withdrawal failed"
        );

        emit FundsWithdrawn(
            owner(),
            balance
        );
    }

    // ------------------------------------------------------------
    // INTERFACE SUPPORT
    // ------------------------------------------------------------

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(
            interfaceId
        );
    }
}
