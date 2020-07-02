const express = require('express');
const app = express();
const helmet = require('helmet');
const compression = require('compression');
const api = require('./api/index.js');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const multer = require('multer');
const upload = multer();

const cookieParser = require('cookie-parser');

require('dotenv').config();
const PORT = process.env.PORT || 3000;
const SU_PASS = process.env.SU_PASS;
const SESSION_SECRET = process.env.SESSION_SECRET;

// connect DB
// mongoose.connect('mongodb://localhost:27017/works', {useNewUrlParser: true, useUnifiedTopology: true})
// .catch(err => console.log(err));
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}).catch(err => console.log(err));

app.use(cookieParser());
app.use(helmet({
    frameguard: { action: 'deny' }
}));
app.set('view engine', 'ejs')
app.use('/api', api);
app.use(bodyParser.json()); //for parsing application/json
app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static('public'));
app.use('/', express.static('public')); // made so to place robots.txt
app.use('/views', express.static);
app.use(compression());

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    name: 'su',
    cookie: {
        maxAge: false,
        httpOnly: true,
        sameSite: true,
        //secure: true
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        collection: 'sessions',
    })
}));

// clear the cookie for infinite scroll for all routes
app.use((req, res, next) => {
    if(req.path.includes('api')) next();
    res.clearCookie('works_last_date');
    next();
});

// error handling middleware
app.use((err, req, res, next) => {
    console.log('>'+err);
    if(!err.statusCode) { 
    err.statusCode = 500;
    if(!err.message) err.message = 'Internal server error';
    }
    res.status(err.statusCode).json({
        status: 'error',
        statusCode: err.statusCode,
        message: err.message
    });
});

app.get('/', (req, res) => {
    res.cookie('works_last_date', new Date(Date.now()).toISOString());
    res.render('index', { su: req.session.su });
});
app.get('/add', (req, res) => res.render('add', { su: req.session.su }));
app.get('/cms', (req, res) => res.render('cms', { su: req.session.su }));
app.get('/edit/:id', (req, res) => res.render('edit', { su: req.session.su, workId: req.params.id }));
app.get('/su', (req, res) => res.render('su', { su: req.session.su }));
app.post('/login',  (req, res) => {
    //check for cookie first!!!
    // and add cookies before responding
    
    if(req.body.password && req.body.password !== SU_PASS)
    res.status(403).json({
        status: 'error',
        message: 'forbidden'
    });
    else if(req.body.password && req.body.password === SU_PASS) {
        if(!req.session.su) req.session.su = true;

        res.status(200).json({
            status: 'success',
            message: 'ok'
        });
    }
    else res.status(500).json({
        status: 'error',
        message: 'req.body is undefined'
    });
});
app.post('/logout', (req, res) => {
    if (req.session.su) req.session.su = null;

    res.status(200).json({
        status: 'success',
        message: 'ok'
    });
});
app.get('*', (req, res) => res.status(404).render('notfound'));

app.listen(PORT, () => {
    console.log(`running on port: ${PORT}`);
});