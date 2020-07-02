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

module.exports = {
    createError,
    createError500,
}