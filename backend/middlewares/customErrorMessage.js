const generateError = (error, includeErrorField = true) => {
    const errorResponse = {
        success: false,
        message: error.message.replace(/"/g, ''),
    };

    if (includeErrorField) {
        errorResponse.errorField = error._original;
    }

    return errorResponse;
};

module.exports = { generateError };