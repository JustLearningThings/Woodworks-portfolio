const express = require('express');
const app = express();
const helpers = require('./helpers/helpers.js');
const handleError = require('./helpers/error.js');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.toLocaleLowerCase()}`)
});

let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const acceptedMimes = ['image/png', 'image/jpg', 'image/jpeg', 'image/x-dcraw', 'image/x-panasonic-raw', 'image/x-nikon-nef'];

        if (req.files.length >= 30) {
            req.fileValidationError = 'Too many files';
            cb(null, false);
        }
        if (acceptedMimes.includes(file.mimetype)) cb(null, true);
        else {
            req.fileValidationError = 'All files must be images';
            cb(handleError.createError(422, 'Files must be images'));
        }
    },
    limits: {files: 30}
});

// Routes
app.post('/works',
    upload.array('images'),
    (req, res, next) => {
        if(req.fileValidationError) {
            helpers.deleteUploadedFiles(req, res, next);
            return next(handleError.createError(422, req.fileValidationError));
        }

        return next();
    },
    helpers.validationMiddlewares,
    helpers.validateWork,
    helpers.optimizeNewImages,
    (req, res, next) => {
        // create work model
        let model = {
            textData: {
                ro: {
                    title: req.body.title,
                    description: req.body.description
                },
                ru: {
                    title: req.body.title_ru,
                    description: req.body.description_ru
                }
            },
            type: req.body.type,
            description: req.body.description
        };

        try { 
            helpers.addToDB(req, res, model, next);
        } 
        catch(err) {
            next(handleError.createError500('Can not POST work: ' + err));
        }
    });

app.get('/works', (req, res, next) => {
    let type = req.query.type;
    let lang = req.query.lang;
    let shouldFilter = req.query.filter;

    if(!lang) lang = 'ro';

    if(type) helpers.getWorksOfType(lang, type, req, res, next);
    else helpers.getWorks(lang, shouldFilter, req, res, next);
});

app.get('/works/:id', (req, res, next) => {
    let lang = req.query.lang;
    let shouldFilter = req.query.filter;

    if (!lang) lang = 'ro';
    if (!shouldFilter) shouldFilter = true;

    if (req.params.id && req.params.id.length > 0) helpers.getWork(lang, shouldFilter, req, res, next);
    else res.status(204).json({ message: 'Work not found' });
});

// q: /works/random?num=4, where num is optional
app.get('/works/random', (req, res, next) => {
    try {
        helpers.getRandomWorks(req.query.num, res, next);
    }
    catch(err) {
        helpers.handleError(err, res, next);
    }
});

app.delete('/works/:id', (req, res, next) => {
    if (req.query.imgs && req.query.imgs[0] === '*') helpers.deleteWorkImagesAll(req, res, next);
    else if(req.query.imgs) helpers.deleteWorkImages(req, res, next);
    else helpers.handleDelete(req, res, next);
});

app.put('/works/:id', 
    upload.array('images'),
    (req, res, next) => {
        if (Object.keys(req.body).length === 0 && req.body.constructor === Object) next(handleError.createError500('req.body is undefined at PUT'));
        if (req.fileValidationError) {
            helpers.deleteUploadedFiles(req, res, next);
            next(handleError.createError(422, req.fileValidationError));
        }
        next();
    },
    helpers.validationMiddlewaresPUT,
    helpers.validateWork,
    (req, res, next) => {
        let model = { textData: { ro: {}, ru: {} } };

        if(req.body.type && req.body.type !== '') model.type = req.body.type;
        if(req.body.title && req.body.title !== '') model.textData.ro.title = req.body.title;
        if(req.body.description && req.body.description !== '') model.textData.ro.description = req.body.description;
        if(req.body.title_ru && req.body.title_ru !== '') model.textData.ru.title = req.body.title_ru;
        if(req.body.description_ru && req.body.description_ru !== '') model.textData.ru.description = req.body.description_ru;

        try {
            helpers.updateWork(req, res, model, next);
        }
        catch(err){
            helpers.handleError(err, res, next);
        }    
});

app.put('/works/:id/views', helpers.updateWorkViews);

module.exports = app;