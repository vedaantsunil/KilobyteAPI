const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) 
        return res.status(401).send('Access denied, no token')
    try {
        const decoded = jwt.verify(token, 'JWTprivatekey')
        req.User = decoded;
        next();
    }
    catch (ex) {
        res.status(400).send('Invalid token');
    }
}

module.exports = auth;