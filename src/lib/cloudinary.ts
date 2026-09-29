import "server-only";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { PAGE_BANNER_FOLDER } from "@/lib/page-banner-defaults";
import { FACTORY_PDF_FOLDER } from "@/lib/machinery-defaults";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function getConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary configuration is missing.");
  }
  return { cloudName, apiKey, apiSecret };
}

function uploadAsset(
  data: Buffer,
  { folder, format }: { folder: string; format: string },
) {
  const { cloudName, apiKey, apiSecret } = getConfig();

  return new Promise<{ imageUrl: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
        resource_type: "image",
        folder,
        public_id: randomUUID(),
        overwrite: false,
        format,
        timeout: 60000,
      },
      (error, result) => {
        if (error || !result) {
          // SDK error objects can contain request credentials; log only the code.
          console.error("Cloudinary upload failed", { code: error?.http_code });
          reject(new Error("Cloudinary upload failed."));
          return;
        }
        try {
          const url = new URL(result.secure_url);
          if (
            url.origin !== "https://res.cloudinary.com" ||
            !url.pathname.startsWith(`/${cloudName}/image/upload/`) ||
            !result.public_id
          ) {
            throw new Error("Unexpected Cloudinary upload response.");
          }
          resolve({ imageUrl: result.secure_url, publicId: result.public_id });
        } catch {
          reject(new Error("Unexpected Cloudinary upload response."));
        }
      },
    );
    stream.on("error", () => reject(new Error("Cloudinary upload stream failed.")));
    stream.end(data);
  });
}

export async function uploadLogo(png: Buffer) {
  return uploadAsset(png, { folder: "alliance-sourcing-bd/logos", format: "png" });
}

export async function uploadBannerImage(data: Buffer, format: "webp" | "png") {
  const asset = await uploadAsset(data, {
    folder: "alliance-sourcing-bd/banners",
    format,
  });

  // A banner record may only ever reference an asset in the banner folder.
  if (!asset.publicId.startsWith("alliance-sourcing-bd/banners/")) {
    throw new Error("Unexpected Cloudinary upload response.");
  }

  return asset;
}

/**
 * The footer CTA background. Same bounded wide-image profile as a banner, but
 * kept in its own folder so the two can be rotated independently and a stored
 * CTA image can never be confused with a banner reference.
 */
export async function uploadFooterCtaImage(
  data: Buffer,
  format: "webp" | "png",
) {
  const asset = await uploadAsset(data, {
    folder: "alliance-sourcing-bd/footer-cta",
    format,
  });

  if (!asset.publicId.startsWith("alliance-sourcing-bd/footer-cta/")) {
    throw new Error("Unexpected Cloudinary upload response.");
  }

  return asset;
}

/**
 * The per-page cover photographs, in one folder shared by every page banner.
 * Same bounded wide-image profile as a banner, but kept apart from the banner
 * and footer-CTA folders so the three can be rotated independently and a stored
 * page-banner reference can never be confused with either of the others.
 */
export async function uploadPageBannerImage(
  data: Buffer,
  format: "webp" | "png",
) {
  const asset = await uploadAsset(data, {
    folder: PAGE_BANNER_FOLDER,
    format,
  });

  if (!asset.publicId.startsWith(`${PAGE_BANNER_FOLDER}/`)) {
    throw new Error("Unexpected Cloudinary upload response.");
  }

  return asset;
}

/** Category photographs share the existing bounded image processing pipeline. */
export async function uploadSourcingImage(data: Buffer, format: "webp" | "png") {
  const asset = await uploadAsset(data, { folder: "alliance-sourcing-bd/sourcing", format });
  if (!asset.publicId.startsWith("alliance-sourcing-bd/sourcing/")) {
    throw new Error("Unexpected Cloudinary upload response.");
  }
  return asset;
}

/**
 * The factory profile PDF behind the "Own Factory" buttons.
 *
 * Uploaded as a `raw` asset rather than an image: a document must be delivered
 * exactly as it was supplied, so it skips the image pipeline, the resize and
 * the format conversion entirely. Its own folder keeps a document reference
 * from ever being accepted where a photograph is expected.
 */
export async function uploadFactoryPdf(data: Buffer) {
  const { cloudName, apiKey, apiSecret } = getConfig();

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
        resource_type: "raw",
        folder: FACTORY_PDF_FOLDER,
        public_id: randomUUID(),
        overwrite: false,
        format: "pdf",
        timeout: 60000,
      },
      (error, result) => {
        if (error || !result) {
          // SDK error objects can contain request credentials; log only the code.
          console.error("Cloudinary PDF upload failed", { code: error?.http_code });
          reject(new Error("Cloudinary upload failed."));
          return;
        }
        try {
          const url = new URL(result.secure_url);
          if (
            url.origin !== "https://res.cloudinary.com" ||
            !url.pathname.startsWith(`/${cloudName}/raw/upload/`) ||
            !result.public_id
          ) {
            throw new Error("Unexpected Cloudinary upload response.");
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        } catch {
          reject(new Error("Unexpected Cloudinary upload response."));
        }
      },
    );
    stream.on("error", () =>
      reject(new Error("Cloudinary upload stream failed.")),
    );
    stream.end(data);
  });
}
