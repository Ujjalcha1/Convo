import mongoose from "mongoose";
import User from "./models/User";
import Conversation from "./models/Conversation";
import Message from "./models/Message";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatapp';

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Mask database password for safe logging
    const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB using URI: ${maskedUri}`);

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        // Explicitly reference models to prevent tree-shaking and ensure Mongoose registrations
        const registeredModels = { User, Conversation, Message };
        console.log(
          "Registered schemas in Mongoose model registry:",
          Object.keys(registeredModels),
        );
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
