import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "test";

type MongoConnection = {
  client: MongoClient;
  db: Db;
};

// Global is used here to maintain a cached connection across hot reloads in development.
// This prevents exhausting your database connection limit.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  var __mongoClientPromise: Promise<MongoConnection> | undefined;
}

let cached = globalThis.__mongoClientPromise;

if (!cached) {
  const client = new MongoClient(uri);
  cached = client.connect().then((client) => ({ client, db: client.db(dbName) }));
  globalThis.__mongoClientPromise = cached;
}

export async function connectToDatabase() {
  return cached!;
}
