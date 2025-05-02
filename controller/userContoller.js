const userModel = require("../model/userModel");
const { sendRegistrationSuccessEmail } = require("../service/mail");
const cloudinary = require('cloudinary').v2
// const sendRegistrationSuccessEmail = require('../service/mail') 

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
        const subject = 'Registration Successful';
        const body = `Thank you for registering for the UK Masterclass application portal, ${firstName} ${lastName}. Your application is currently pending review. We will notify you of any updates.`;
        await sendRegistrationSuccessEmail({ email: create.email, firstName: create.firstName, lastName: create.lastName }); // Pass an object containing the user details
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
    // const findAllUsers = await userModel.find().populate('countryOfOrigin').populate('travellingTo')
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

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { status: status, rejectionReason: rejectionReason },
            { new: true }
        ).populate('countryOfOrigin').populate('travellingTo'); // Populate for email content

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        let subject = '';
        let body = '';

        if (status === 'approved') {
            subject = 'Your UK Masterclass Application - Approved!';
            body = `Congratulations, ${updatedUser.firstName} ${updatedUser.lastName}! Your application for the UK Masterclass has been approved. We will be in touch with the next steps soon.`;
        } else if (status === 'rejected') {
            subject = 'Your UK Masterclass Application - Rejected';
            body = `Dear ${updatedUser.firstName} ${updatedUser.lastName}, we regret to inform you that your application for the UK Masterclass has been rejected due to the following reason(s): ${rejectionReason || 'No specific reason provided.'}`;
        } else if (status === 'pending') {
            subject = 'Your UK Masterclass Application - Status Update';
            body = `Dear ${updatedUser.firstName} ${updatedUser.lastName}, the status of your UK Masterclass application is currently pending review. We will notify you of any updates.`;
        }

        if (subject && body) {
            await sendMail(updatedUser.email, subject, body);
        }

        return res.status(200).json({ message: "User status updated successfully", data: updatedUser });
    } catch (err) {
        handleError(res, err);
    }
};


// exports.updateStatus = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { status, rejectionReason } = req.body;

//         const updateFields = { status: status };
//         if (status === 'rejected' && rejectionReason) {
//             updateFields.rejectionReason = rejectionReason;
//         } else if (status !== 'rejected') {
//             updateFields.rejectionReason = null; // Or '', depending on your preference
//         }

//         const updatedUser = await userModel.findByIdAndUpdate(
//             userId,
//             updateFields,
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         return res.status(200).json({ message: "User status updated successfully", data: updatedUser });
//     } catch (err) {
//         handleError(res, err);
//     }
// };

// exports.updateStatus = async (req, res) => {
//     try {
//         const { userId } = req.params; // Get the user's ID from the URL parameters
//         const { status, rejectionReason } = req.body; // Get the new status and (optional) rejection reason from the request body

//         const updatedUser = await userModel.findByIdAndUpdate(
//             userId,
//             { status: status, rejectionReason: rejectionReason }, // Update the status and rejectionReason
//             { new: true } // Return the updated document
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         return res.status(200).json({ message: "User status updated successfully", data: updatedUser });
//     } catch (err) {
//         handleError(res, err);
//     }
// };
