const notFound = (req, res, next) => {

    return res.status(404).json({
        success: false,
        status: "fail",
        message: `Route '${req.originalUrl}' not found.`,
    });

};

module.exports = notFound;