const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    contact: { type: String, required: true },
    image: { type: String },
    email_id: { type: String, required: true },
  },
  { timestamps: true }
);

const School = mongoose.model("School", schoolSchema);
module.exports = School;
