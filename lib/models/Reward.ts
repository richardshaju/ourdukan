import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReward extends Document {
  shopId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  points: number;
  description: string;
  claimedAt: Date | null;
  createdAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Reward: Model<IReward> =
  mongoose.models.Reward || mongoose.model<IReward>('Reward', RewardSchema);

export default Reward;

