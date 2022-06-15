module.exports = function (req, res, next) {
    
    if (!req.User.isAdmin)
        return res.status(403).send('Access denied');
    
    next();
}