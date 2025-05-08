const userModel = require("../model/userModel");
const {
  sendRegistrationSuccessEmail,
  sendApplicationStatusEmail,
  sendCustomAdminEmail,
} = require("../service/mail");
const cloudinary = require("cloudinary").v2;

const handleError = (res, err) => {
  console.error("SERVER ERROR:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  return res.status(500).json({
    message: "An error occurred",
    error: err?.message || err.toString(),
    stack: err?.stack || null,
  });
};

exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      number,
      countryOfOrigin,
      travellingTo,
    } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const documents = {};
    const fields = [
      'bscCertificate',
      'transcript',
      'wassceCertificate',
      'cv',
      'personalStatement',
      'passportBiodata',
      'referenceLetter1',
      'referenceLetter2'
    ];

    fields.forEach((field) => {
      if (req.files[field] && req.files[field][0]) {
        documents[field] = req.files[field][0].path; //  Already a Cloudinary URL
      }
    });

    const newUser = await userModel.create({
      firstName,
      lastName,
      email,
      number,
      countryOfOrigin,
      travellingTo,
      documents,
    });

    await sendRegistrationSuccessEmail({
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    return res.status(201).json({
      message: "User created successfully",
      data: newUser,
    });
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .populate(["countryOfOrigin", "travellingTo"]);

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getAllStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const users = await userModel.find({ status });

    return res.status(200).json({
      message: "Users by status fetched",
      data: users,
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejectionReason } = req.body;

    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({
        message: "Rejection reason is required when rejecting",
      });
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { status, rejectionReason },
        { new: true }
      )
      .populate(["countryOfOrigin", "travellingTo"]);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendApplicationStatusEmail(updatedUser);

    return res.status(200).json({
      message: "User status updated",
      data: updatedUser,
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getStatusCounts = async (req, res) => {
  try {
    const counts = await userModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const defaultCounts = { approved: 0, rejected: 0, pending: 0 };
    counts.forEach((item) => {
      defaultCounts[item._id] = item.count;
    });

    const total = counts.reduce((sum, item) => sum + item.count, 0);

    return res.status(200).json({
      message: "Status counts fetched",
      data: { total, ...defaultCounts },
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.sendEmailToUser = async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({
      message: "All fields (email, subject, message) required",
    });
  }

  try {
    const sent = await sendCustomAdminEmail({ email, subject, message });
    if (sent) {
      return res.status(200).json({ message: "Email sent successfully" });
    } else {
      return res.status(500).json({ message: "Failed to send email" });
    }
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await userModel.findByIdAndDelete(userId);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
    await userModel.deleteMany();
    return res.status(200).json({ message: "All users deleted" });
  } catch (err) {
    handleError(res, err);
  }
};
