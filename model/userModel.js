const { Schema, model } = require("mongoose");

const userModel = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    number: {type: String, required: true},
    countryOfOrigin: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        // required: true
    },
    travellingTo: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        // required: false
    },
    certificates: [{type: String}],
    applicationStatus: {type: String, enum: ['pending', 'approved', 'rejected']},
    rejectionReason: {type: String}
})

module.exports = model('User', userModel)