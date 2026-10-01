import { NextResponse } from "next/server";

const PINATA_UPLOAD_URL =
  "https://uploads.pinata.cloud/v3/files";

const MAX_BATCH_SIZE = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

async function uploadToPinata(file, filename) {
  const jwt = process.env.PINATA_JWT?.trim();

  if (!jwt || jwt === "YOUR_PINATA_JWT") {
    throw new Error(
      "PINATA_JWT is not configured"
    );
  }

  const formData = new FormData();

  formData.append("network", "public");
  formData.append("file", file);
  formData.append("name", filename);

  const response = await fetch(
    PINATA_UPLOAD_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
        result?.message ||
        "Pinata upload failed"
    );
  }

  const cid = result?.data?.cid;

  if (!cid) {
    throw new Error(
      "Pinata did not return a CID"
    );
  }

  return {
    cid,
    ipfsURI: `ipfs://${cid}`,
  };
}

export async function POST(request) {
  try {
    const formData =
      await request.formData();

    const files = formData
      .getAll("images")
      .filter(
        (entry) =>
          entry instanceof File
      );

    const tokenIds =
      JSON.parse(
        formData.get("tokenIds") || "[]"
      );

    const description =
      String(
        formData.get("description") || ""
      ).trim() ||
      "Soapy Miners NFT Collection on Quai Network.";

    if (
      files.length === 0 ||
      files.length > MAX_BATCH_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Batch must contain between 1 and 50 images.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      tokenIds.length !==
      files.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Token ID count does not match image count.",
        },
        {
          status: 400,
        }
      );
    }

    const seenTokenIds =
      new Set();

    for (const tokenId of tokenIds) {
      if (
        !Number.isInteger(tokenId) ||
        tokenId < 1 ||
        tokenId > 256
      ) {
        throw new Error(
          `Invalid token ID: ${tokenId}`
        );
      }

      if (
        seenTokenIds.has(tokenId)
      ) {
        throw new Error(
          `Duplicate token ID: ${tokenId}`
        );
      }

      seenTokenIds.add(tokenId);
    }

    const results = [];

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const image =
        files[index];

      const tokenId =
        tokenIds[index];

      if (
        !ALLOWED_TYPES.has(
          image.type
        )
      ) {
        throw new Error(
          `Unsupported image type for token #${tokenId}`
        );
      }

      if (
        image.size >
        MAX_FILE_SIZE
      ) {
        throw new Error(
          `Image for token #${tokenId} exceeds 10 MB`
        );
      }

      const extension =
        image.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "png";

      const name =
        `Soapy Miner #${tokenId}`;

      const imageUpload =
        await uploadToPinata(
          image,
          `soapy-miner-${tokenId}.${extension}`
        );

      const metadata = {
        name,
        description,
        image:
          imageUpload.ipfsURI,
      };

      const metadataBlob =
        new Blob(
          [
            JSON.stringify(
              metadata,
              null,
              2
            ),
          ],
          {
            type:
              "application/json",
          }
        );

      const metadataFile =
        new File(
          [metadataBlob],
          `soapy-miner-${tokenId}.json`,
          {
            type:
              "application/json",
          }
        );

      const metadataUpload =
        await uploadToPinata(
          metadataFile,
          `soapy-miner-${tokenId}.json`
        );

      results.push({
        tokenId,
        name,

        imageCID:
          imageUpload.cid,

        imageURI:
          imageUpload.ipfsURI,

        metadataCID:
          metadataUpload.cid,

        metadataURI:
          metadataUpload.ipfsURI,

        metadata,
      });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      nfts: results,
    });
  } catch (error) {
    console.error(
      "Batch upload failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Batch upload failed",
      },
      {
        status: 500,
      }
    );
  }
}
