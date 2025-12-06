import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShop extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rewardRate: number; // points per purchase amount (e.g., 0.1 = 1 point per 10 currency units)
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    rewardRate: {
      type: Number,
      required: true,
      default: 0.1, // 1 point per 10 currency units
    },
  },
  {
    timestamps: true,
  }
);

const Shop: Model<IShop> =
  mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;

