import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  imageUrl: string;
  isRead: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

// Indexes for ultra-fast sorting during paginated message retrievals
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
