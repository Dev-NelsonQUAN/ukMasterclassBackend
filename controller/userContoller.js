const userModel = require("../model/userModel");
const {
  sendRegistrationSuccessEmail,
  sendApplicationStatusEmail,
  sendCustomAdminEmail,
} = require("../service/mail");
const { cloudinary, uploadToCloudinary } = require("../config/cloudinary"); 

const handleError = async (res, err) => {
  console.error("--- ERROR HANDLER CALLED ---", err);
  return res.status(500).json({ messsage: "An error occurred", error: err.message || err });
};

exports.createUser = async (req, res) => {
  try {
    const files = req.files;
    const uploadPromises = [];
    const cloudinaryFolder = 'ukMasterclassUploads';
    const documents = {};

    for (const fieldName in files) {
      if (files[fieldName] && files[fieldName].length > 0) {
        const file = files[fieldName][0];

        let resourceType = "raw";
        if (file.mimetype && file.mimetype.startsWith('image/')) {
          resourceType = "image";
        } else if (file.mimetype && file.mimetype.startsWith('video/')) {
          resourceType = "video";
        }

        const public_id = `${fieldName}_${Date.now()}`;
        const uploadPromise = uploadToCloudinary(file, resourceType, cloudinaryFolder, { public_id })
          .then(result => {
            documents[fieldName] = result.secure_url; // Store URL in the documents object
            console.log(`--- ${fieldName} UPLOADED SUCCESSFULLY ---`, result?.secure_url);
          })
          .catch(error => {
            console.error(`--- ERROR UPLOADING ${fieldName} ---`, error);
            throw error; // Re-throw to reject Promise.all
          });
        uploadPromises.push(uploadPromise);
      }
    }

    await Promise.all(uploadPromises);

    const newUser = new userModel({
      ...req.body,
      documents: documents,
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

// ... (and so on for other user-related operations) ...
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
    


// ... (and so on for other user-related operations) ...

// // controller/userController.js
// const userModel = require("../model/userModel");
// const {
//   sendRegistrationSuccessEmail,
//   sendApplicationStatusEmail,
//   sendCustomAdminEmail,
// } = require("../service/mail");
// const { cloudinary, uploadToCloudinary } = require("../config/cloudinary"); // Import from config

// const handleError = async (res, err) => {
//   console.error("--- ERROR HANDLER CALLED ---", err);
//   return res.status(500).json({ messsage: "An error occurred", error: err.message || err });
// };

// exports.createUser = async (req, res) => {
//   try {
//     const files = req.files;
//     const uploadPromises = [];
//     const cloudinaryFolder = 'ukMasterclassUploads';
//     const user = { identity: {} }; // Initialize user identity object

//     console.log("--- START OF CREATE USER ---"); // Added log

//     for (const fieldName in files) {
//       if (files[fieldName] && files[fieldName].length > 0) {
//         const file = files[fieldName][0];
//         console.log(`--- FILE OBJECT IN CONTROLLER (${fieldName}) ---`);
//         console.log(file); // Log the entire file object for inspection
//         console.log(`--- MIMETYPE IN CONTROLLER (${fieldName}) ---:`, file.mimetype); // Specifically log mimetype

//         let resourceType = "raw";
//         if (file.mimetype && file.mimetype.startsWith('image/')) {
//           resourceType = "image";
//         } else if (file.mimetype && file.mimetype.startsWith('video/')) {
//           resourceType = "video";
//         }

//         const public_id = `${fieldName}_${Date.now()}`;
//         const uploadPromise = uploadToCloudinary(file, resourceType, cloudinaryFolder, { public_id })
//           .then(result => {
//             user.identity[fieldName] = result.secure_url;
//             console.log(`--- ${fieldName} UPLOADED SUCCESSFULLY ---`, result?.secure_url);
//           })
//           .catch(error => {
//             console.error(`--- ERROR UPLOADING ${fieldName} ---`, error);
//             throw error; // Re-throw to reject Promise.all
//           });
//         uploadPromises.push(uploadPromise);
//       }
//     }

//     await Promise.all(uploadPromises);

//     const newUser = new userModel({
//       ...req.body,
//       identity: user.identity,
//     });

//     const savedUser = await newUser.save();
//     console.log("--- USER MODEL CREATED ---", savedUser);
//     res.status(201).json({ message: "User created successfully", user: savedUser });

//     // --- Email Sending Logic (Adjust as per your actual implementation) ---
//     if (savedUser.email) {
//       sendRegistrationSuccessEmail(savedUser.email, savedUser.firstName);
//     }
//     if (process.env.ADMIN_EMAIL) {
//       sendCustomAdminEmail(process.env.ADMIN_EMAIL, 'New User Registration', JSON.stringify(savedUser, null, 2));
//     }
//     // --- End of Email Sending Logic ---

//     console.log("--- END OF CREATE USER (Success) ---"); // Added log

//   } catch (err) {
//     console.log("--- END OF CREATE USER (Error) ---"); // Added log for error case
//     handleError(res, err);
//   }
// };


// exports.getUserById = async (req, res) => {
//   try {
//     const user = await userModel.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.status(200).json(user);
//   } catch (err) {
//     handleError(res, err);
//   }
// };

// exports.getAllUser = async (req, res) => {
//       try {
//         const users = await userModel
//           .find()
//           .populate(["countryOfOrigin", "travellingTo"]);
    
//         return res.status(200).json({
//           message: "Users fetched successfully",
//           data: users,
//         });
//       } catch (err) {
//         handleError(res, err);
//       }
//     };
    
//     exports.getAllStatus = async (req, res) => {
//       try {
//         const { status } = req.params;
//         const users = await userModel.find({ status });
    
//         return res.status(200).json({
//           message: "Users by status fetched",
//           data: users,
//         });
//       } catch (err) {
//         handleError(res, err);
//       }
//     };
    
//     exports.updateStatus = async (req, res) => {
//       try {
//         const { userId } = req.params;
//         const { status, rejectionReason } = req.body;
    
//         if (status === "rejected" && !rejectionReason) {
//           return res.status(400).json({
//             message: "Rejection reason is required when rejecting",
//           });
//         }
    
//         const updatedUser = await userModel
//           .findByIdAndUpdate(
//             userId,
//             { status, rejectionReason },
//             { new: true }
//           )
//           .populate(["countryOfOrigin", "travellingTo"]);
    
//         if (!updatedUser) {
//           return res.status(404).json({ message: "User not found" });
//         }
    
//         await sendApplicationStatusEmail(updatedUser);
    
//         return res.status(200).json({
//           message: "User status updated",
//           data: updatedUser,
//         });
//       } catch (err) {
//         handleError(res, err);
//       }
//     };
    
// //     exports.getStatusCounts = async (req, res) => {
// //       try {
// //         const counts = await userModel.aggregate([
// //           { $group: { _id: "$status", count: { $sum: 1 } } },
// //         ]);
    
// //         const defaultCounts = { approved: 0, rejected: 0, pending: 0 };
// //         counts.forEach((item) => {
// //           defaultCounts[item._id] = item.count;
// //         });
    
// //         const total = counts.reduce((sum, item) => sum + item.count, 0);
    
// //         return res.status(200).json({
// //           message: "Status counts fetched",
// //           data: { total, ...defaultCounts },
// //         });
// //       } catch (err) {
// //         handleError(res, err);
// //       }
// //     };
    
// //     exports.sendEmailToUser = async (req, res) => {
// //       const { email, subject, message } = req.body;
    
// //       if (!email || !subject || !message) {
// //         return res.status(400).json({
// //           message: "All fields (email, subject, message) required",
// //         });
// //       }
    
// //       try {
// //         const sent = await sendCustomAdminEmail({ email, subject, message });
// //         if (sent) {
// //           return res.status(200).json({ message: "Email sent successfully" });
// //         } else {
// //           return res.status(500).json({ message: "Failed to send email" });
// //         }
// //       } catch (err) {
// //         handleError(res, err);
// //       }
// //     };
    
// //     exports.deleteUser = async (req, res) => {
// //       try {
// //         const { userId } = req.params;
// //         const deleted = await userModel.findByIdAndDelete(userId);
    
// //         if (!deleted) {
// //           return res.status(404).json({ message: "User not found" });
// //         }
    
// //         return res.status(200).json({ message: "User deleted successfully" });
// //       } catch (err) {
// //         handleError(res, err);
// //       }
// //     };
    
// //     exports.deleteAllUsers = async (req, res) => {
// //       try {
// //         await userModel.deleteMany();
// //         return res.status(200).json({ message: "All users deleted" });
// //       } catch (err) {
// //         handleError(res, err);
// //       }
// //     };
    

// // // ... (and so on for other user-related operations) ...

// // // const userModel = require("../model/userModel");
// // // const {
// // //   sendRegistrationSuccessEmail,
// // //   sendApplicationStatusEmail,
// // //   sendCustomAdminEmail,
// // // } = require("../service/mail");
// // // const { uploadToCloudinary } = require("../config/cloudinary"); 

// // // const handleError = async (res, err) =>  {
// // //   console.error("--- ERROR HANDLER CALLED ---", err);
// // //   return res.status(500).json({messsage: "An error occurred", error: err.message || err})
// // // }

// // // exports.createUser = async (req, res) => {
// // //   try {
// // //     console.log("--- START OF CREATE USER ---");
// // //     console.log("req.body:", req.body);
// // //     console.log("req.files:", JSON.stringify(req.files, null, 2)); 

// // //     if (req.fileValidationError) {
// // //       console.log("--- FILE VALIDATION ERROR ---", req.fileValidationError);
// // //       return res.status(400).json({ message: "File upload error", error: req.fileValidationError });
// // //     }

// // //     const {
// // //       firstName,
// // //       lastName,
// // //       email,
// // //       number,
// // //       countryOfOrigin,
// // //       travellingTo,
// // //     } = req.body;

// // //     console.log("--- BEFORE FINDING EXISTING USER ---", { email });
// // //     const existingUser = await userModel.findOne({ email });
// // //     console.log("--- AFTER FINDING EXISTING USER ---", existingUser);
// // //     if (existingUser) {
// // //       console.log("--- EMAIL ALREADY EXISTS ---", email);
// // //       return res.status(409).json({ message: "Email already exists" });
// // //     }

// // //     const user = new userModel({
// // //       firstName,
// // //       lastName,
// // //       email,
// // //       number,
// // //       countryOfOrigin,
// // //       travellingTo,
// // //       identity: {}
// // //     });
// // //     console.log("--- USER MODEL CREATED ---", user);

// // //     const files = req.files;
// // //     const cloudinaryFolder = "ukMasterclassUploads";

// // //     async function uploadFileAndCleanUp(file, resourceType, folder, options) {
// // //       console.log(`Attempting to process file: ${file.originalname} (${file.fieldname})`);
// // //       let result = null;
// // //       try {
// // //         const buffer = file.buffer;
// // //         console.log(`Successfully accessed buffer from multer - Buffer size: ${buffer.length}`);
// // //         console.log("--- TYPEOF BUFFER FROM MULTER ---:", typeof buffer);
// // //         console.log("--- IS BUFFER FROM MULTER AN INSTANCEOF Buffer? ---:", buffer instanceof Buffer);
// // //         console.log("--- BEFORE uploadToCloudinary ---", { resourceType, folder, options });
// // //         result = await uploadToCloudinary(buffer, resourceType, folder, options);
// // //         console.log("--- AFTER uploadToCloudinary ---", result);
// // //         return result;
// // //       } catch (error) {
// // //         console.error(`Error uploading file ${file.originalname}:`, error);
// // //         throw error;
// // //       }
// // //     }

// // //     const uploadPromises = [];

// // //     for (const fieldName in files) {
// // //       if (files[fieldName] && files[fieldName].length > 0) {
// // //         const file = files[fieldName][0];
// // //         let resourceType = "raw"; 
// // //         if (file.mimetype.startsWith('image/')) {
// // //           resourceType = "image";
// // //         } else if (file.mimetype.startsWith('video/')) {
// // //           resourceType = "video";
// // //         }

// // //         const public_id = `${fieldName}_${Date.now()}`;
// // //         const uploadPromise = uploadFileAndCleanUp(file, resourceType, cloudinaryFolder, { public_id })
// // //           .then(result => {
// // //             user.identity[fieldName] = result.secure_url;
// // //             console.log(`--- ${fieldName} UPLOADED ---`, result?.secure_url);
// // //           })
// // //           .catch(error => {
// // //             console.error(`--- ERROR UPLOADING ${fieldName} ---`, error);
// // //             throw error;
// // //           });
// // //         uploadPromises.push(uploadPromise);
// // //       }
// // //     }

// // //     await Promise.all(uploadPromises);

// // //     console.log("--- BEFORE SAVING USER TO DATABASE ---", user);
// // //     await user.save();
// // //     console.log("--- AFTER SAVING USER TO DATABASE ---", user);

// // //     console.log("--- BEFORE SENDING REGISTRATION EMAIL ---", user.email);
// // //     await sendRegistrationSuccessEmail({
// // //       email: user.email,
// // //       firstName: user.firstName,
// // //       lastName: user.lastName,
// // //     });
// // //     console.log("--- AFTER SENDING REGISTRATION EMAIL ---", user.email);

// // //     console.log("--- END OF CREATE USER (Success) ---");
// // //     return res.status(201).json({
// // //       message: "User created successfully",
// // //       data: user,
// // //     });
// // //   } catch (err) {
// // //     handleError(res, err);
// // //     console.error("ERROR in createUser:", err);
// // //     console.log(err);
// // //     console.log(err.message);
// // //     console.log("--- END OF CREATE USER (Error) ---");
// // //     return; 
// // //   }
// // // };

// // // exports.getAllUser = async (req, res) => {
// // //   try {
// // //     const users = await userModel
// // //       .find()
// // //       .populate(["countryOfOrigin", "travellingTo"]);

// // //     return res.status(200).json({
// // //       message: "Users fetched successfully",
// // //       data: users,
// // //     });
// // //   } catch (err) {
// // //     handleError(res, err);
// // //   }
// // // };

// // // exports.getAllStatus = async (req, res) => {
// // //   try {
// // //     const { status } = req.params;
// // //     const users = await userModel.find({ status });

// // //     return res.status(200).json({
// // //       message: "Users by status fetched",
// // //       data: users,
// // //     });
// // //   } catch (err) {
// // //     handleError(res, err);
// // //   }
// // // };

// // // exports.updateStatus = async (req, res) => {
// // //   try {
// // //     const { userId } = req.params;
// // //     const { status, rejectionReason } = req.body;

// // //     if (status === "rejected" && !rejectionReason) {
// // //       return res.status(400).json({
// // //         message: "Rejection reason is required when rejecting",
// // //       });
// // //     }

// // //     const updatedUser = await userModel
// // //       .findByIdAndUpdate(
// // //         userId,
// // //         { status, rejectionReason },
// // //         { new: true }
// // //       )
// // //       .populate(["countryOfOrigin", "travellingTo"]);

// // //     if (!updatedUser) {
// // //       return res.status(404).json({ message: "User not found" });
// // //     }

// // //     await sendApplicationStatusEmail(updatedUser);

// // //     return res.status(200).json({
// // //       message: "User status updated",
// // //       data: updatedUser,
// // //     });
// // //   } catch (err) {
// // //     handleError(res, err);
// // //   }
// // // };

// // // exports.getStatusCounts = async (req, res) => {
// // //   try {
// // //     const counts = await userModel.aggregate([
// // //       { $group: { _id: "$status", count: { $sum: 1 } } },
// // //     ]);

// // //     const defaultCounts = { approved: 0, rejected: 0, pending: 0 };
// // //     counts.forEach((item) => {
// // //       defaultCounts[item._id] = item.count;
// // //     });

// // //     const total = counts.reduce((sum, item) => sum + item.count, 0);

// // //     return res.status(200).json({
// // //       message: "Status counts fetched",
// // //       data: { total, ...defaultCounts },
// // //     });
// // //   } catch (err) {
// // //     handleError(res, err);
// // //   }
// // // };

// // // exports.sendEmailToUser = async (req, res) => {
// // //   const { email, subject, message } = req.body;

// // //   if (!email || !subject || !message) {
// // //     return res.status(400).json({
// // //       message: "All fields (email, subject, message) required",
// // //     });
// // //   }

// // //   try {
// // //     const sent = await sendCustomAdminEmail({ email, subject, message });
// // //     if (sent) {
// // //       return res.status(200).json({ message: "Email sent successfully" });
// // //     } else {
// // //       return res.status(500).json({ message: "Failed to send email" });
// // //     }
// // //   } catch (err) {
// // //     handleError(res, err);
// // //   }
// // // };

// // // exports.deleteUser = async (req, res) => {
// // //   try {
// // //     const { userId } = req.params;
// // //     const deleted = await userModel.findByIdAndDelete(userId);

// // //     if (!deleted) {
// // //       return res.status(404).json({ message: "User not found" });
// // //     }

// // //     return res.status(200).json({ message: "User deleted successfully" });
// // //   } catch (err) {
// // //     handleError(res, err);
// // //   }
// // // };

// // // exports.deleteAllUsers = async (req, res) => {
// // //   try {
// // //     await userModel.deleteMany();
// // //     return res.status(200).json({ message: "All users deleted" });
// // //   } catch (err) {
// // //     handleError(res, err);
// // //   }
// // // };

