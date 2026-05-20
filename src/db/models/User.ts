import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
  lastActive: Date;
  pinnedConversations: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "Hey there! I am using ChatApp." },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    pinnedConversations: [{ type: Schema.Types.ObjectId, ref: 'Conversation' }]
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
