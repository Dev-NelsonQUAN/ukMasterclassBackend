const { Schema, model } = require("mongoose");

const userModel = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  number: { type: String, required: true },
  countryOfOrigin: {
    type: String,
    // type: Schema.Types.ObjectId,
    // ref: 'Country',
  },
  travellingTo: {
    type: String,
    // type: Schema.Types.ObjectId,
    // ref: 'Country',
  },
  documents: {
    bscCertificate: { type: String },
    transcript: { type: String },
    wassceCertificate: { type: String },
    cv: { type: String },
    personalStatement: { type: String },
    passportBiodata: { type: String },
    referenceLetter1: { type: String },
    referenceLetter2: { type: String },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rejectionReason: { type: String },
});

module.exports = model("User", userModel);
