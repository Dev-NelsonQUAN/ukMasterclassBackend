const { Schema, model } = require("mongoose");

const userModel = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  number: { type: String, required: true },
  countryOfOrigin: {
    type: String,
  },
  travellingTo: {
    type: String,
  },
  documents: {
    type: Object,
    default: {}
    // bscCertificate: { type: String },
    // transcript: { type: String },
    // wassceCertificate: { type: String },
    // cv: { type: String },
    // personalStatement: { type: String },
    // passportBiodata: { type: String },
    // referenceLetter1: { type: String },
    // referenceLetter2: { type: String },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rejectionReason: { type: String },
},
{timestamps: true}
);

module.exports = model("User", userModel);
