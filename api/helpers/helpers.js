const express = require('express');
const Works = require('../models/work.js');
const Images = require('../models/image.js');
const handleError = require('./error.js');
const fs = require('fs');
const sharp = require('sharp');

const { body, validationResult } = require('express-validator');

// Validation
const validationMiddlewares = [
    body('title').not().isEmpty().withMessage('Empty title').trim().escape(),
    body('title_ru').not().isEmpty().withMessage('Empty title').trim().escape(),
    body('type').not().isEmpty().withMessage('Empty type').trim().escape(),
    body('description').optional({checkFalsy: true}).not().isEmpty().withMessage('Empty description').trim().escape(),
    body('description_ru').optional({checkFalsy: true}).not().isEmpty().withMessage('Empty description').trim().escape()
];

const validationMiddlewaresPUT = [
    body('title').trim().escape(),
    body('title_ru').trim().escape(),
    body('type').trim().escape(),
    body('description').optional({ checkFalsy: true, nullable: true }).trim().escape(),
    body('description_ru').optional({ checkFalsy: true, nullable: true }).trim().escape()
];

const validateWork = (req, res, next) => {
    let messages = new Array();

    // check for html entities
    if (req.body.title && req.body.title.includes('&')) messages += `Invalid title.`;
    if (req.body.title_ru && req.body.title_ru.includes('&')) messages += 'Invalid title.';
    if (req.body.type && req.body.type.includes('&')) messages += `Invalid type.`;
    if (req.body.description && req.body.description.includes('&')) messages += `Invalid description.`;
    if (req.body.description_ru && req.body.description_ru.includes('&')) messages += `Invalid description.`;

    if(messages.length > 0) next(handleError.createError(422, messages));

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        // create the error messages for each error
        errors.array().forEach(error => messages += `${error.msg}.`);
        // handle the errors
        next(handleError.createError(422, messages));
    }

    next();
};

const optimizeNewImages = (req, res, next) => {
    if (!req.files) return next();

    // resize images for faster page loading and less space occupied
    req.files.forEach(async (image) => {
        let path = image.path;

        await sharp(image.path)
            .resize({ width: 1000, height: null }) // height is adjusted based on the aspect ratio of the image
            .toBuffer((err, buffer) => {
                if (err) next(handleError.createError500());

                fs.writeFileSync(image.path, buffer);
            })
    });

    return next();
};

// delete all files from request if validation failed
const deleteUploadedFiles = (req, res, next) => {
    if(!req.files || req.files.length <= 0) next(handleError.createError500());

    req.files.forEach(file => {
        let path = file.path.split('').map(char => char === '\\' ? '/' : char).join('');

        fs.unlink(path, err => { if (err) next(handleError.createError500('unable to unlink files')) });
    });
};

// Create
const addToDB = async function (req, res, model, next) {
    if(!req.body) next(handleError.createError500());
    if (!model) next(handleError.createError500('model is null or undefined'));

    let imagesToAdd = [];
    let work = await Works.create(model).catch(err => next(err));

    if (!req.files || !req.files.length) {
        res.status(201).json({status: 'success', message: 'work created', work: work});
        return;
    }

    req.files.forEach(image => {
        let path = image.path.split('').map(char => char === '\\' ? '/' : char).join('');
        let imageModel = {
            fileName: image.filename,
            mimeType: image.mimetype,
            imageURL: `${path}`,
            workId: work._id
        };

        imagesToAdd.push(imageModel);
    });

    let createdImages = await Images.create(imagesToAdd).catch(err => next(err));
    let imageIds = [];

    createdImages.forEach(image => imageIds.push(image._id));

    await Works.updateMany({ _id: work._id }, { $push: { images: { $each: imageIds } } }).catch(err => next(err));
    Works.findOne({ _id: work._id })
        .populate('images')
        .then(populatedWork => res.status(201).json({status: 'success', message: 'work created' , work: populatedWork}))
        .catch(err => next(err));
};

// Read
const filterWorkLanguage = function (work, lang) {
    if (lang === 'ru') work.textData.ro = [];
    else work.textData.ru = [];
};

const filterLanguageOfWorks = function (works, lang) { // private to this module
    works.forEach(work => { filterWorkLanguage(work, lang) });
}


const getWork = function(lang, shouldFilter=true, req, res, next) {
    Works.findById(req.params.id)
    .populate({path: 'images'})
    .exec((err, work) => {
        if (err) next(handleError.createError500('Error on db query: ' + err));

        if (work) {
            if(shouldFilter === true) {
                filterWorkLanguage(work, lang);
                //work._id = null;
                work._v = null;
                work.images.forEach(image => {
                    image._id = null;
                    image.__v = null;
                    image.workId = null;
                });
            }

            res.status(200).json(work);
        }
        else res.status(204).json({
            status: 'OK',
            message: 'Work not found'
        });
    });
};

const getWorks = function (lang, shouldFilter=true, req, res, next) {
    let lastDate = req.cookies.works_last_date;

    Works.find({ uploadDate: { $lt: lastDate } })
        .limit(12)
        .sort({ uploadDate: -1 })
        .populate({ path: 'images' })
        .exec((err, works) => {
            if (err) next(handleError.createError500('Error on db query: ' + err));

            if (works && works.length > 0) {
                if(shouldFilter === true) {
                    // remove unnecessary data when sending data to client
                    filterLanguageOfWorks(works, lang);
                    works.forEach(work => {
                        //work._id = null;
                        work.__v = null;

                        work.images.forEach(image => {
                            image._id = null;
                            image.__v = null;
                            image.workId = null;
                        });
                    });
                }

                res.cookie('works_last_date', works[works.length - 1].uploadDate);
                res.status(200).json(works);
            } 
            else res.status(204).json({
                    status: 'OK',
                    message: 'No more works'
                });
        })
}

const getWorksOfType = function (lang, type, req, res, next) {
    let lastDate = req.cookies.works_last_date;

    Works
        .find({ type: type, uploadDate: {$lt: lastDate} })
        .limit(12)
        .sort({ uploadDate: -1 })
        .populate({ path: 'images' })
        .exec((err, works) => {
            if(err) next(handleError.createError500('Error on db query: ' + err));

            if(works && works.length > 0) {
                // remove unnecessary data when sending data to client
                filterLanguageOfWorks(works, lang);
                works.forEach(work => {
                    //work._id = null;
                    work.__v = null;

                    work.images.forEach(image => {
                        image._id = null;
                        image.__v = null;
                        image.workId = null;
                    });
                });

                res.cookie('works_last_date', works[works.length - 1].uploadDate);
                res.status(200).json(works);
            } else {
                res.status(204).json({
                    status: 'OK',
                    message: 'No more works of this type'
                });
            }
        })
};

const getRandomWorks = function (num, res, next) {
    let n = parseInt(num) || 5;

    if (!n) n = 5;

    Works
        .aggregate([{
            $sample: { size: n }
        }])
        .then(works => {
           let workIds = [];

            works.forEach(work => {
                workIds.push(work._id);
            });

            Works
                .find({ _id: workIds })
                .populate('images')
                .then(populatedWorks => {
                    works.forEach(work => {
                        work._id = null;
                        work.__v = null;

                        work.images.forEach(image => {
                            image._id = null;
                            image.__v = null;
                            image.workId = null;
                        });
                    });
                    res.status(200).json(populatedWorks)
                })
                .catch(err => next(err));
        })
        .catch(err => next(err));
};


// update
const updateWork = async function updateWork(req, res, model, next) {
    if (!model) handleError.createError500('model is null');

    // get the work's title, type and description
    let work = await Works.findById(req.params.id).catch(err => next(err));
    let titleRo = work.textData.ro.title;
    let titleRu = work.textData.ru.title;
    let descriptionRo = work.textData.ro.description;
    let descriptionRu = work.textData.ru.description;
    let type = work.type;

    if(model.textData.ro.description == undefined) model.textData.ro.description = '';
    if(model.textData.ru.description == undefined) model.textData.ru.description = '';

    // {new: true} to get the updated doc in the callback
    let updatedWork = await Works.findByIdAndUpdate(req.params.id, model, { useFindAndModify: false, new: true }).catch(err => next(err));

    if (!req.files || !req.files.length) {
        res.status(201).json({status: 'success', message: 'work updated', work: updatedWork});
        return; // unnecessary, perhaps a precaution
    }

    let imagesToAdd = [];

    req.files.forEach(image => {
        let path = image.path.split('').map(char => char === '\\' ? '/' : char).join('');
        let imageModel = {
            fileName: image.filename,
            mimeType: image.mimetype,
            imageURL: `${path}`,
            workId: req.params.id
        };

        imagesToAdd.push(imageModel);
    });

    let createdImages = await Images.create(imagesToAdd).catch(err => next(err));
    let imageIds = [];

    createdImages.forEach(image => imageIds.push(image._id));

    await Works.updateMany({ _id: req.params.id }, { 
        $push: { images: { $each: imageIds } }, 
        model
    }).catch(err => next(err));

    updatedWork = await Works.findById(req.params.id).catch(err => next(err));

    res.status(201).json({status: 'success', message: 'work updated', updatedWork: updatedWork});
};

// updates views count by 1
const updateWorkViews = (req, res, next) => {
    if (!req.params.id) res.status(304).json({
        status: 'Not Modified',
        message: 'No title in req.params'
    })

    Works.findById(req.params.id)
    .exec(async (err, work) => {
        if (err) next(handleError.createError500('error on db query: ' + err));

        work.views++;
        await work.save();

        res.status(204).json({
            status: 'No Content',
            message: 'work updated'
        })
    });
}

// delete
const handleDelete = function handleDelete(req, res, next) {
    Works.findById(req.params.id)
        .populate({path: 'images'})
        .then(foundWork => {
           if(!foundWork) throw handleError.createError500('work is null or undefined');

            let imageIds = [];
            let imagePaths = [];

            if (!imageIds || !(imageIds instanceof Array)) throw handleError.createError500('imgs parameter is not an array');

            foundWork.images.forEach(image => {
                imagePaths.push(image.imageURL);
                imageIds.push(image._id);
            });

            Works.findByIdAndDelete(foundWork._id)
                .then(() => {
                    // delete images meta from db 
                    imageIds.forEach(id => {
                        Images.findByIdAndDelete(id)
                            .catch(err => next(err));
                    });

                    // delete image files
                    imagePaths.forEach(path => fs.unlinkSync(path, err => { if(err) throw handleError.createError500('unable to unlink files') }));
                })
                .catch(err => next(err));

            res.status(200).json({ status: 'success', message: 'work deleted' });
        })
        .catch(err => next(err));
};

const deleteWorkImages = function deleteWorkImages(req, res, next) {
    Works.findById(req.params.id)
        .populate({path: 'images'})
        .then(foundWork => {
            if (!req.query.imgs) throw handleError.createError500('images query is not defined!');

            let imageIds = req.query.imgs;
            let imagePaths = [];
            
            if(!imageIds || !(imageIds instanceof Array)) throw handleError.createError500('imgs parameter is not an array');

            imageIds.forEach(id => {
                // push the image path to the paths array
                foundWork.images.forEach(image => {
                    if (image._id == id) imagePaths.push(image.imageURL);
                });

                // delete the image meta from db
                Images.findByIdAndDelete(id).catch(err => next(err));
            });
            
            imagePaths.forEach(path => fs.unlinkSync(path, err => { if(err) throw handleError.createError500('unable to unlink files') }));
            
            res.status(200).json({ status: 'success', message: 'image(s) deleted' });
        })
        .catch(err => next(err));
};

const deleteWorkImagesAll = function (req, res, next) {
    if(!req.query.imgs || req.query.imgs[0] !== '*') next(handleError.createError500('unable to delete all work images: req.params.id !== \'*\''));

    Works.findById(req.params.id)
        .populate({path: 'images'})
        .then(foundWork => {
            let imagePaths = [];

            foundWork.images.forEach(image => {
                imagePaths.push(image.imageURL);

                // delete images' meta from db
                Images.findByIdAndDelete(image._id).catch(err => next(err));
            });

            // delete images' from /uploads
            imagePaths.forEach(path => fs.unlink(path, err => { if(err) throw handleError.createError500('unable to unlink files') }));

            res.status(200).json({status: 'success', message: 'images deleted'});
        })
        .catch(err => next(err));
}

// exporting module
exports.validationMiddlewares = validationMiddlewares;
exports.validationMiddlewaresPUT = validationMiddlewaresPUT;
exports.validateWork = validateWork;
exports.optimizeNewImages = optimizeNewImages;
exports.deleteUploadedFiles = deleteUploadedFiles;
exports.handleError = handleError;
exports.addToDB = addToDB;
exports.getWork = getWork;
exports.getWorks = getWorks;
exports.getWorksOfType = getWorksOfType;
exports.getRandomWorks = getRandomWorks;
exports.updateWork = updateWork;
exports.updateWorkViews = updateWorkViews;
exports.handleDelete = handleDelete;
exports.deleteWorkImages = deleteWorkImages;
exports.deleteWorkImagesAll = deleteWorkImagesAll;