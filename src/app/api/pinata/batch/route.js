import { NextResponse } from "next/server";

import {
  createNftMetadataUpload,
  parseTokenIdFromFilename,
} from "@/lib/pinataServer";

const MAX_BATCH_SIZE = 50;

export async function POST(request) {
  try {
    const formData =
      await request.formData();

    const images =
      formData
        .getAll("images")
        .filter(
          (entry) =>
            entry instanceof File
        );

    const description =
      formData.get("description");

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select at least one image file",
        },
        { status: 400 }
      );
    }

    if (images.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Batch limit is ${MAX_BATCH_SIZE} NFTs`,
        },
        { status: 400 }
      );
    }

    const parsedEntries = [];
    const seenTokenIds =
      new Set();

    for (const image of images) {
      const tokenId =
        parseTokenIdFromFilename(
          image.name
        );

      if (
        !tokenId ||
        tokenId < 1 ||
        tokenId > 256
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Could not parse a valid token ID from "${image.name}". Use names like 1.png or #25.png`,
          },
          { status: 400 }
        );
      }

      if (
        seenTokenIds.has(tokenId)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Duplicate token ID #${tokenId} in batch`,
          },
          { status: 400 }
        );
      }

      seenTokenIds.add(tokenId);
      parsedEntries.push({
        image,
        tokenId,
      });
    }

    parsedEntries.sort(
      (a, b) =>
        a.tokenId - b.tokenId
    );

    const nfts = [];

    for (const entry of parsedEntries) {
      const nft =
        await createNftMetadataUpload(
          {
            imageFile: entry.image,
            tokenId: entry.tokenId,
            description,
          }
        );

      nfts.push(nft);
    }

    return NextResponse.json({
      success: true,
      count: nfts.length,
      nfts,
    });
  } catch (error) {
    console.error(
      "Batch NFT upload failed:",
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
      { status: 500 }
    );
  }
}
