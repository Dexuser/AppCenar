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
      required: true
    },

    street: {
      type: String,
      required: true
    },

    sector: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    reference: {
      type: String,
      required: true
    },
  },
  {
    timestamps: true,
    collection: "Adresses"
  }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
