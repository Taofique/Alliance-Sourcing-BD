import "server-only";
import sharp from "sharp";
import type { Metadata } from "sharp";
import { SaxesParser } from "saxes";

/**
 * Shared image-safety core. Both the logo pipeline and the banner pipeline use
 * these checks so neither can be uploaded past validation: the allowlist for
 * SVG markup, magic-byte detection, actual-format confirmation through libvips,
 * and rejection of animated or oversized-pixel input.
 */

export class ImageInputError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ImageInputError";
  }
}

// Static SVG subset: no embedded images, stylesheets, animation or filters.
const elements = new Set(
  "svg g defs symbol use path rect circle ellipse line polyline polygon text tspan title desc linearGradient radialGradient stop clipPath mask".split(
    " ",
  ),
);
const attributes = new Set(
  "id x y x1 y1 x2 y2 cx cy r rx ry width height viewBox preserveAspectRatio d points transform fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity clip-path clip-rule mask offset stop-color stop-opacity gradientUnits gradientTransform spreadMethod fx fy fr font-family font-size font-weight font-style text-anchor dominant-baseline dx dy rotate lengthAdjust textLength vector-effect".split(
    " ",
  ),
);
const styleProperties = new Set(
  "fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity clip-path clip-rule mask stop-color stop-opacity font-family font-size font-weight font-style text-anchor dominant-baseline".split(
    " ",
  ),
);

function checkValue(value: string) {
  // XML entities have already been decoded. This is a restricted value grammar,
  // not a general CSS sanitizer. Reject escapes/comments and non-fragment URLs.
  const rest = value.replace(/url\(\s*(['"]?)#[a-zA-Z_][\w.-]*\1\s*\)/g, "");
  if (
    /[\\@:<>&]/.test(rest) ||
    /\/\*|\*\/|url\s*\(|expression\s*\(/i.test(rest)
  ) {
    throw new Error("Unsafe resource or CSS value");
  }
}

function validateSvg(input: Buffer) {
  const source = new TextDecoder("utf-8", { fatal: true }).decode(input);
  const parser = new SaxesParser({ xmlns: true });
  let rootSeen = false;
  let depth = 0;
  let count = 0;

  parser.on("error", (error) => {
    throw error;
  });
  parser.on("doctype", () => {
    throw new Error("DTDs are forbidden");
  });
  parser.on("processinginstruction", () => {
    throw new Error("Processing instructions are forbidden");
  });
  parser.on("opentag", (tag) => {
    if (++depth > 64 || ++count > 10000) throw new Error("SVG is too complex");
    if (!rootSeen && tag.local !== "svg")
      throw new Error("Expected SVG root");
    rootSeen = true;
    if (
      tag.uri !== "http://www.w3.org/2000/svg" ||
      !elements.has(tag.local)
    ) {
      throw new Error("Unsupported SVG element");
    }
    for (const attribute of Object.values(tag.attributes)) {
      const { local, uri, value } = attribute;
      if (uri === "http://www.w3.org/2000/xmlns/") continue;
      if (
        local === "href" &&
        (!uri || uri === "http://www.w3.org/1999/xlink")
      ) {
        if (!/^#[a-zA-Z_][\w.-]*$/.test(value))
          throw new Error("Only internal references are allowed");
      } else if (!uri && local === "style") {
        for (const declaration of value.split(";")) {
          if (!declaration.trim()) continue;
          const separator = declaration.indexOf(":");
          if (
            separator < 0 ||
            !styleProperties.has(declaration.slice(0, separator).trim())
          ) {
            throw new Error("Unsupported SVG style");
          }
          checkValue(declaration.slice(1 + separator));
        }
      } else {
        if (uri || !attributes.has(local))
          throw new Error("Unsupported SVG attribute");
        checkValue(value);
      }
    }
  });
  parser.on("closetag", () => {
    depth--;
  });

  parser.write(source).close();

  if (!rootSeen) throw new Error("Empty SVG");
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * Content sniffing, not the declared MIME type or the filename extension.
 */
function looksBinary(input: Buffer) {
  if (input.subarray(0, 8).equals(PNG_SIGNATURE)) return true;
  if (input[0] === 255 && input[1] === 216 && input[2] === 255) return true;
  if (
    input.toString("ascii", 0, 4) === "RIFF" &&
    input.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }
  return (
    input.length >= 16 &&
    input[0] === 0 &&
    input[1] === 0 &&
    input.toString("ascii", 4, 8) === "ftyp"
  );
}

function rejectAnimatedPng(input: Buffer) {
  // Not every libvips build reports APNG as multipage.
  for (let offset = 8; offset + 12 <= input.length; ) {
    if (input.toString("ascii", offset + 4, offset + 8) === "acTL") {
      throw new Error("Animated PNG");
    }
    offset += 12 + input.readUInt32BE(offset);
  }
}

export const SUPPORTED_IMAGE_MESSAGE =
  "Use a valid, static PNG, JPEG, WebP, AVIF or self-contained SVG (up to 16 million pixels). SVG scripts, external resources and unsupported markup are not allowed.";

export type VerifiedImage = {
  metadata: Metadata;
  isVector: boolean;
};

/**
 * Confirms the bytes really are a single still frame in a supported format.
 * Non-binary input must pass XML validation BEFORE libvips reads metadata.
 */
export async function verifyStillImage(input: Buffer): Promise<VerifiedImage> {
  const binary = looksBinary(input);
  if (!binary) validateSvg(input);

  const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" });
  const metadata = await image.metadata();
  const supported =
    ["png", "jpeg", "webp", "svg"].includes(metadata.format) ||
    (metadata.format === "heif" && metadata.compression === "av1");

  if (
    !supported ||
    (binary && metadata.format === "svg") ||
    (metadata.pages ?? 1) !== 1
  ) {
    throw new Error("Unsupported or animated image");
  }

  if (metadata.format === "png") rejectAnimatedPng(input);

  return { metadata, isVector: metadata.format === "svg" };
}
