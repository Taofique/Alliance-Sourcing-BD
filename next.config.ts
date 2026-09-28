import type { NextConfig } from "next";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
if (cloudName && !/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
  throw new Error("CLOUDINARY_CLOUD_NAME has an invalid format.");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: cloudName
      ? [{
          protocol: "https",
          hostname: "res.cloudinary.com",
          port: "",
          pathname: `/${cloudName}/image/upload/**`,
          search: "",
        }]
      : [],
  },
};

export default nextConfig;
