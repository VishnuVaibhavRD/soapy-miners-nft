import { NextResponse } from "next/server";

import {
  createNftMetadataUpload,
} from "@/lib/pinataServer";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image");
    const name = formData.get("name");
    const description = formData.get("description");
    const tokenIdValue = formData.get("tokenId");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "NFT image is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "NFT name is required",
        },
        {
          status: 400,
        }
      );
    }

    const tokenId = Number(tokenIdValue);

    if (
      !Number.isInteger(tokenId) ||
      tokenId < 1 ||
      tokenId > 256
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Token ID must be between 1 and 256",
        },
        {
          status: 400,
        }
      );
    }

    const nft = await createNftMetadataUpload({
      imageFile: image,
      tokenId,
      description:
        String(description || "").trim() ||
        "Soapy Miners NFT Collection on Quai Network.",
    });

    return NextResponse.json({
      success: true,
      nft: {
        ...nft,
        name: String(name).trim(),
      },
    });
  } catch (error) {
    console.error("NFT upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "NFT upload failed",
      },
      {
        status: 500,
      }
    );
  }
}
