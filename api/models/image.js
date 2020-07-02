let mongoose = require('mongoose');

let imageSchema = new mongoose.Schema({
    imageURL: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        trim: true
    },
    mime: String,
    workId: {type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: true}
});

let Image = mongoose.model('Image', imageSchema);

module.exports = Image;