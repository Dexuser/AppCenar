import mongoose from "mongoose";

const configSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    value: {
      type: String,
      default: null,
    },

    // Legacy field kept temporarily while the API migration is in progress.
    itebis: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Config",
  }
);

const Config = mongoose.model("Config", configSchema);

export default Config;
