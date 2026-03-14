import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  const data = await request.json();
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const message = String(data.message || "").trim();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const now = new Date();
  const result = await db.collection("entries").insertOne({
    name,
    email,
    message,
    createdAt: now,
  });

  return NextResponse.json({ id: result.insertedId.toString(), createdAt: now.toISOString() });
}

export async function GET() {
  const { db } = await connectToDatabase();
  const entries = await db
    .collection("entries")
    .find()
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return NextResponse.json(
    entries.map((entry) => ({
      ...entry,
      _id: entry._id.toString(),
      createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
    }))
  );
}
