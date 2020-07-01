const createError = (statusCode, message) => {
    console.log(message);
    let err = new Error(message);
    err.statusCode = statusCode;
    return err;
};

const createError500 = (message='Internal server error') => {
    let err = createError(500, message);
    return err;
};

// const sendErrorJSON = (err=createError500(), res) => {
//     if(!err.message) err.message = 'Internal server error'; // not necessary tho
//     res.status(err.statusCode).json(err.message);
// };

module.exports = {
    createError,
    createError500,
}