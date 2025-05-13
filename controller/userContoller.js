const userModel = require("../model/userModel");
const {
  sendRegistrationSuccessEmail,
  sendApplicationStatusEmail,
  sendCustomAdminEmail,
} = require("../service/mail");
const { cloudinary, uploadToCloudinary } = require("../config/cloudinary");

const handleError = async (res, err) => {
  return res
    .status(500)
    .json({ messsage: "An error occurred", error: err.message || err });
};

exports.createUser = async (req, res) => {
  try {
    const { email, documents, ...userData } = req.body;

    const files = req.files;
    const cloudinaryFolder = "ukMasterclassUploads";
    // const documents = {};

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Email address is already registered" });
    }

    const uploadPromises = [];

    for (const fieldName in files) {
      if (files[fieldName] && files[fieldName].length > 0) {
        const file = files[fieldName][0];

        let resourceType = "raw";
        if (file.mimetype && file.mimetype.startsWith("image/")) {
          resourceType = "image";
        } else if (file.mimetype && file.mimetype.startsWith("video/")) {
          resourceType = "video";
        }

        const public_id = `${fieldName}_${Date.now()}`;
        const uploadPromise = uploadToCloudinary(
          file,
          resourceType,
          cloudinaryFolder,
          { public_id }
        )
          .then((result) => {
            documents[fieldName] = result.secure_url; // Store URL in the documents object
            console.log(
              `--- ${fieldName} UPLOADED SUCCESSFULLY ---`,
              result?.secure_url
            );
          })
          .catch((error) => {
            console.error(`--- ERROR UPLOADING ${fieldName} ---`, error);
            throw error; // Re-throw to reject Promise.all
          });
        uploadPromises.push(uploadPromise);
      }
    }

    await Promise.all(uploadPromises);

    const newUser = new userModel({
      ...userData,
      email: email,
      documents: documents || {},
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        number: savedUser.number,
        status: savedUser.status,
        documents: savedUser.documents,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
        __v: savedUser.__v,
      },
    });

    if (savedUser.email) {
      sendRegistrationSuccessEmail(savedUser.email, savedUser.firstName);
    }
    // if (process.env.ADMIN_EMAIL) {
    //   sendCustomAdminEmail(process.env.ADMIN_EMAIL, 'New User Registration', JSON.stringify(savedUser, null, 2));
    // }
  } catch (err) {
    handleError(res, err);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.status(200).json(users);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    handleError(res, err);
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
      .findByIdAndUpdate(userId, { status, rejectionReason }, { new: true })
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
