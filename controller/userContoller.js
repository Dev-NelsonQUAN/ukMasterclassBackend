const userModel = require("../model/userModel");
const {
  sendRegistrationSuccessEmail,
  sendApplicationStatusEmail,
  sendCustomAdminEmail,
} = require("../service/mail");
const cloudinary = require("cloudinary").v2;

const handleError = async (res, err) => {
  return res
    .status(500)
    .json({ message: "An error occurred", error: err.message || err });
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
    const documents = {};

    const checkIfUserExists = await userModel.findOne({ email });

    if (checkIfUserExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Handle multiple file uploads
    if (req.files) {
      const uploadPromises = Object.keys(req.files).map(async (fieldname) => {
        const file = req.files[fieldname][0]; // Multer sends array of files for each field
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: `ukMasterclassUploads/${email}`, // Organize by user email
            public_id: `${fieldname}_${Date.now()}`,
            allowed_formats: ["jpg", "png", "jpeg", "pdf", "doc", "docx"],
            transformation: [{ width: 800, height: 800, crop: "limit" }],
          });
          documents[fieldname] = result.secure_url;
          return true;
        } catch (uploadErr) {
          console.error(`Error uploading ${fieldname}:`, uploadErr);
          return false; // Indicate upload failure
        } finally {
          // Optionally remove the temporary file from the server
          // fs.unlinkSync(file.path);
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      if (uploadResults.some((failed) => !failed)) {
        return res
          .status(500)
          .json({ message: "Error uploading one or more documents" });
      }
    }

    const create = await userModel.create({
      firstName,
      lastName,
      email,
      number,
      countryOfOrigin,
      travellingTo,
      documents: documents,
    });

    if (create) {
      const subject = "Registration Successful";
      const body = `Thank you for registering for the UK Masterclass application portal, ${firstName} ${lastName}. Your application is currently pending review. We will notify you of any updates.`;
      await sendRegistrationSuccessEmail({
        email: create.email,
        firstName: create.firstName,
        lastName: create.lastName,
      });
    }

    return res
      .status(201)
      .json({ message: "User created successfully", data: create });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const findAllUsers = await userModel
      .find()
      .populate(["countryOfOrigin", "travellingTo"]);

    return res
      .status(200)
      .json({ message: "All user gotten successfully", data: findAllUsers });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getAllStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const getStatus = await userModel.find({ status });

    return res
      .status(200)
      .json({ message: "Status gotten successfully", data: getStatus });
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
        message: "Rejection reason is required when rejecting an application.",
      });
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, { status, rejectionReason }, { new: true })
      .populate("countryOfOrigin")
      .populate("travellingTo");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendApplicationStatusEmail(updatedUser);

    return res.status(200).json({
      message: "User status updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getStatusCounts = async (req, res) => {
  try {
    const counts = await userModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to key-value format like { approved: 5, rejected: 2, pending: 3 }
    const formattedCounts = {
      approved: 0,
      rejected: 0,
      pending: 0,
    };

    counts.forEach((item) => {
      formattedCounts[item._id] = item.count;
    });

    const total = counts.reduce((sum, item) => sum + item.count, 0);

    return res.status(200).json({
      message: "Status counts fetched successfully",
      data: {
        total,
        ...formattedCounts,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.sendEmailToUser = async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res
      .status(400)
      .json({ message: "All fields (email, subject, message) are required." });
  }

  try {
    const success = await sendCustomAdminEmail({ email, subject, message });
    if (success) {
      return res.status(200).json({ message: "Email sent successfully." });
    } else {
      return res.status(500).json({ message: "Email sending failed." });
    }
  } catch (error) {
    console.error("Error in sendEmailToUser:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deleteTheUser = await userModel.findByIdAndDelete(userId);

    if (!deleteTheUser) {
      return res.status(409).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
    const findAllUser = await userModel.deleteMany();

    return res.status(200).json({ message: "All users deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};
