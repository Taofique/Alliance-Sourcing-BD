import "server-only";
import { connectDB } from "@/lib/db";

export type SourcingCategory = {
  id: string;
  title: string;
  description: string;
  image: string;
};

/** Reads the reference BuyingHouse CMS without replacing its editing/upload flow. */
export async function getSourcingCategories(): Promise<SourcingCategory[]> {
  const connection = await connectDB();
  const records = await connection.connection.collection("buyinghouses")
    .find({})
    .sort({ sortOrder: 1, _id: 1 })
    .toArray();

  return records.map((record) => ({
    id: record._id.toString(),
    title: String(record.title ?? ""),
    description: String(record.description ?? ""),
    image: String(record.image ?? ""),
  }));
}
