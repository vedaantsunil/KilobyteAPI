module.exports = function (req, res, next) {
    
    if (!req.User.isCustomer)
        return res.status(403).send('Access denied');
    
    next();
}