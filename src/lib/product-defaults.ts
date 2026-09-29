import type { InitialProductCatalogue } from "@/types/products";

/** Uploads made through the admin land here, apart from every other asset type. */
export const PRODUCT_IMAGE_FOLDER = "alliance-sourcing-bd/products";

/**
 * The catalogue the site launches with: 3 categories, 6 subcategories, 24 product
 * records.
 *
 * Every photograph is hosted on our own Cloudinary account in the product folder
 * above, exactly as an admin upload would be, so the page has no dependency on
 * any other account and `next.config` only has to allow a single host.
 *
 * The repeated names are intentional and are not duplicates to be tidied up. Five
 * separate "Five Pocket Twill" garments and two of each ladies' style are real,
 * separately photographed rows in the source catalogue, and each one is an
 * independent record an admin can reorder, hide or re-photograph.
 */
export const initialProductCatalogue: InitialProductCatalogue = [
  {
    name: "Knitwear",
    slug: "knitwear",
    subcategories: [
      {
        name: "T-Shirt",
        slug: "t-shirt",
        products: [
          {
            name: "Premium Soft Touch V-Neck T-Shirt",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650369/alliance-sourcing-bd/products/f88a5dfe-77e9-4f85-b8b0-4daae99a14dd.png",
            publicId: "alliance-sourcing-bd/products/f88a5dfe-77e9-4f85-b8b0-4daae99a14dd",
          },
          {
            name: "Pique Polo Shirt",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650370/alliance-sourcing-bd/products/9365bc30-a02b-4995-9f0d-237b9804048b.webp",
            publicId: "alliance-sourcing-bd/products/9365bc30-a02b-4995-9f0d-237b9804048b",
          },
          {
            name: "Urban Style Graphic T-Shirt",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650371/alliance-sourcing-bd/products/e8b1576c-5056-4526-8fe1-fb4dd497e75b.webp",
            publicId: "alliance-sourcing-bd/products/e8b1576c-5056-4526-8fe1-fb4dd497e75b",
          },
        ],
      },
      {
        name: "Polo",
        slug: "polo",
        products: [
          {
            name: "Classic Piqué Polo Shirt",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650373/alliance-sourcing-bd/products/ed0d073f-eab9-4afe-9463-3a3b052596ae.webp",
            publicId: "alliance-sourcing-bd/products/ed0d073f-eab9-4afe-9463-3a3b052596ae",
          },
          {
            name: "Premium Soft Touch V-Neck T-Shirt",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650374/alliance-sourcing-bd/products/bc093ef6-19eb-42fc-b7d0-40a40db4f2f0.png",
            publicId: "alliance-sourcing-bd/products/bc093ef6-19eb-42fc-b7d0-40a40db4f2f0",
          },
          {
            name: "Sport Dry Polo Shirt",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650375/alliance-sourcing-bd/products/7b797301-7337-448c-9149-668d2abb074a.webp",
            publicId: "alliance-sourcing-bd/products/7b797301-7337-448c-9149-668d2abb074a",
          },
          {
            name: "Urban Style Graphic T-Shirt",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650376/alliance-sourcing-bd/products/1c94c53a-e5d4-4f96-8a58-67a47c54ecb4.webp",
            publicId: "alliance-sourcing-bd/products/1c94c53a-e5d4-4f96-8a58-67a47c54ecb4",
          },
        ],
      },
      {
        name: "Hoodie",
        slug: "hoodie",
        products: [
          {
            name: "Classic Pullover Hoodie",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650377/alliance-sourcing-bd/products/bddcf0c1-3e29-4057-aab9-34f80811bdd7.webp",
            publicId: "alliance-sourcing-bd/products/bddcf0c1-3e29-4057-aab9-34f80811bdd7",
          },
          {
            name: "Zipper Front Fleece Hoodie",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650378/alliance-sourcing-bd/products/d9c43fdd-8078-4817-9e14-5ad924142a15.webp",
            publicId: "alliance-sourcing-bd/products/d9c43fdd-8078-4817-9e14-5ad924142a15",
          },
          {
            name: "Premium Heavyweight Hoodie",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650379/alliance-sourcing-bd/products/7cbac4b5-48ad-46d0-bdd7-dab324138b23.webp",
            publicId: "alliance-sourcing-bd/products/7cbac4b5-48ad-46d0-bdd7-dab324138b23",
          },
          {
            name: "Streetwear Oversized Hoodie",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650380/alliance-sourcing-bd/products/99ffadea-3c43-49f6-9aa6-b92e5e011ac9.webp",
            publicId: "alliance-sourcing-bd/products/99ffadea-3c43-49f6-9aa6-b92e5e011ac9",
          },
        ],
      },
    ],
  },
  {
    name: "Sweaters",
    slug: "sweaters",
    subcategories: [
      {
        name: "Men’s Sweaters",
        slug: "mens-sweaters",
        products: [
          {
            name: "Crew Neck Sweater",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650444/alliance-sourcing-bd/products/b743530b-c5d3-494c-8df4-5d2c652dba83.webp",
            publicId: "alliance-sourcing-bd/products/b743530b-c5d3-494c-8df4-5d2c652dba83",
          },
          {
            name: "V-Neck Sweater",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650381/alliance-sourcing-bd/products/9fabb633-1122-4437-a4ed-e3d8149fb4be.webp",
            publicId: "alliance-sourcing-bd/products/9fabb633-1122-4437-a4ed-e3d8149fb4be",
          },
          {
            name: "Cardigan Sweater",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650382/alliance-sourcing-bd/products/2f6a3db3-4633-4931-a6cd-dcd9eb6ce4e0.webp",
            publicId: "alliance-sourcing-bd/products/2f6a3db3-4633-4931-a6cd-dcd9eb6ce4e0",
          },
          {
            name: "Turtleneck Sweater",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650383/alliance-sourcing-bd/products/bfec956b-72bd-4826-a2b2-a30422868abd.webp",
            publicId: "alliance-sourcing-bd/products/bfec956b-72bd-4826-a2b2-a30422868abd",
          },
        ],
      },
    ],
  },
  {
    name: "Woven",
    slug: "woven",
    subcategories: [
      {
        name: "Five Pocket Twill",
        slug: "five-pocket-twill",
        products: [
          {
            name: "Five Pocket Twill",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650383/alliance-sourcing-bd/products/392a6189-bd22-4051-bf2c-0236ee156aca.png",
            publicId: "alliance-sourcing-bd/products/392a6189-bd22-4051-bf2c-0236ee156aca",
          },
          {
            name: "Five Pocket Twill",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650384/alliance-sourcing-bd/products/dfa108d9-38ad-472e-a74b-79509b20cc64.png",
            publicId: "alliance-sourcing-bd/products/dfa108d9-38ad-472e-a74b-79509b20cc64",
          },
          {
            name: "Five Pocket Twill",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650385/alliance-sourcing-bd/products/e2f24624-6627-4349-b2ac-bd5407dbf7eb.png",
            publicId: "alliance-sourcing-bd/products/e2f24624-6627-4349-b2ac-bd5407dbf7eb",
          },
          {
            name: "Five Pocket Twill",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650386/alliance-sourcing-bd/products/a94147ed-ea37-40d4-a1c6-8f91a908b243.png",
            publicId: "alliance-sourcing-bd/products/a94147ed-ea37-40d4-a1c6-8f91a908b243",
          },
          {
            name: "Five Pocket Twill",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650387/alliance-sourcing-bd/products/cac95371-9e99-45c9-a73c-240c80a51f85.png",
            publicId: "alliance-sourcing-bd/products/cac95371-9e99-45c9-a73c-240c80a51f85",
          },
        ],
      },
      {
        name: "Ladies Dress & Jackets",
        slug: "ladies-dress-jackets",
        products: [
          {
            name: "Ladies Dresses",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650388/alliance-sourcing-bd/products/bb8e4fbe-171e-4d3d-be79-421a9c0e35c4.png",
            publicId: "alliance-sourcing-bd/products/bb8e4fbe-171e-4d3d-be79-421a9c0e35c4",
          },
          {
            name: "Ladies Dresses",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650388/alliance-sourcing-bd/products/093ed8b6-6fc8-47e0-8a03-49d94b200f6c.png",
            publicId: "alliance-sourcing-bd/products/093ed8b6-6fc8-47e0-8a03-49d94b200f6c",
          },
          {
            name: "Ladies Jacket",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650389/alliance-sourcing-bd/products/0dbd45f9-6ffb-4247-ad04-d78f80683484.webp",
            publicId: "alliance-sourcing-bd/products/0dbd45f9-6ffb-4247-ad04-d78f80683484",
          },
          {
            name: "Ladies Jacket",
            imageUrl: "https://res.cloudinary.com/drdsszsms/image/upload/v1790650390/alliance-sourcing-bd/products/5dec4422-0c20-4ee6-b91c-bb8d3dede716.png",
            publicId: "alliance-sourcing-bd/products/5dec4422-0c20-4ee6-b91c-bb8d3dede716",
          },
        ],
      },
    ],
  },
];
