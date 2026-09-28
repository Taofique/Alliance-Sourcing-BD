// Shared browser/server limits; no server dependencies or secrets.
export const MAX_BANNER_BYTES = 2 * 1024 * 1024;
export const BANNER_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.avif,.svg,image/png,image/jpeg,image/webp,image/avif,image/svg+xml";
export const BANNER_MAX_WIDTH = 2560;
export const BANNER_FOLDER = "alliance-sourcing-bd/banners";
export const BANNER_SIZE_MESSAGE = "The image must be 2 MiB or smaller.";
