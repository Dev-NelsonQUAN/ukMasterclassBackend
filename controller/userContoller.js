 const userModel = require('../model/userModel')

 const handleError = async (res, err) => {
    return res.status(500).json({message: "An error occurred", error: err.message || err})
 }

 exports.createUser = async(req, res) => {
    try {
        const {firstName, lastName, email, number} = req.body

        const checkIfUserExists = await userModel.findOne({email})

        if (checkIfUserExists) {
            return res.status(409).json({message: "Email already exists"})
        }

        const create = await userModel.create({firstName, lastName, email, number})

        return res.status(201).json({message: "User created successfully", data: create})
    }
    catch (err) {
        handleError(res, err)
    }
 }

 exports.getAllUser = async (req, res) => {
    try {
        const findAllUsers = await userModel.find()

        return res.status(200).json({message: "All user gotten successfully", data: findAllUsers})
    }
    catch (err) {
        handleError(res, err)
    }
 }