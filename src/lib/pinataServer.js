const PINATA_UPLOAD_URL =
  "https://uploads.pinata.cloud/v3/files";

export const MAX_PINATA_FILE_SIZE =
  10 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export async function uploadToPinata(
  file,
  name
) {
  const jwt =
    process.env.PINATA_JWT?.trim();

  if (!jwt || jwt === "YOUR_PINATA_JWT") {
    throw new Error(
      "PINATA_JWT is not configured. Add your Pinata JWT to .env.local and restart npm run dev."
    );
  }

  const formData = new FormData();

  formData.append("network", "public");
  formData.append("file", file);
  formData.append("name", name);

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

  const result =
    await response.json();

  if (!response.ok) {
    console.error("Pinata error:", result);

    if (response.status === 401) {
      throw new Error(
        "Pinata rejected the JWT (401 Not Authorized). Use a Pinata API key JWT with file upload permission in .env.local, then restart npm run dev."
      );
    }

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

export function parseTokenIdFromFilename(
  filename
) {
  const base = filename.replace(
    /\.[^.]+$/,
    ""
  );

  const exactMatch =
    base.match(/^#?(\d+)$/);

  if (exactMatch) {
    return Number(
      exactMatch[1]
    );
  }

  const trailingMatch =
    base.match(
      /(?:^|[-_#])(\d{1,3})$/
    );

  if (trailingMatch) {
    return Number(
      trailingMatch[1]
    );
  }

  return null;
}

export async function createNftMetadataUpload({
  imageFile,
  tokenId,
  description,
}) {
  if (
    !ALLOWED_IMAGE_TYPES.has(
      imageFile.type
    )
  ) {
    throw new Error(
      `${imageFile.name}: only PNG, JPG and WEBP images are allowed`
    );
  }

  if (
    imageFile.size >
    MAX_PINATA_FILE_SIZE
  ) {
    throw new Error(
      `${imageFile.name}: image must be smaller than 10 MB`
    );
  }

  const name = `Soapy Miner #${tokenId}`;
  const safeName = `soapy-miner-${tokenId}`;

  const extension =
    imageFile.name
      .split(".")
      .pop()
      ?.toLowerCase() || "png";

  const imageUpload =
    await uploadToPinata(
      imageFile,
      `${safeName}.${extension}`
    );

  const metadata = {
    name,
    description:
      String(description || "").trim() ||
      "Soapy Miners NFT Collection on Quai Network.",
    image: imageUpload.ipfsURI,
  };

  const metadataBlob = new Blob(
    [
      JSON.stringify(
        metadata,
        null,
        2
      ),
    ],
    {
      type: "application/json",
    }
  );

  const metadataFile = new File(
    [metadataBlob],
    `${safeName}.json`,
    {
      type: "application/json",
    }
  );

  const metadataUpload =
    await uploadToPinata(
      metadataFile,
      `${safeName}.json`
    );

  return {
    tokenId,
    name: metadata.name,
    description: metadata.description,
    image: imageUpload.ipfsURI,
    imageCID: imageUpload.cid,
    metadataCID:
      metadataUpload.cid,
    metadataURI:
      metadataUpload.ipfsURI,
    metadata,
  };
}
