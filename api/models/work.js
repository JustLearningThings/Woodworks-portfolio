let mongoose = require('mongoose');

let workSchema = new mongoose.Schema({
    uploadDate: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    }],
    type: {
        type: String,
        required: true,
        trim: true
    },
    textData: {
        ro: {
            title: {
                type: String,
                required: true,
                trim: true
            },
            description: {
                type: String,
                trim: true
            }
        },
        ru: {
            title: {
                type: String,
                required: true,
                trim: true
            },
            description: {
                type: String,
                trim: true
            }
        }
    }
});

let Work = mongoose.model('Work', workSchema);

module.exports = Work;