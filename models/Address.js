import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    street: {
      type: String,
      default: null,
    },

    sector: {
      type: String,
      default: null,
    },

    city: {
      type: String,
      default: null,
    },

    reference: {
      type: String,
      default: null,
    },
  },
  {
    
    timestamps: true,
    collection: "Adresses"
  }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
