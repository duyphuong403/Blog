
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.body.authToken;
    if (!token) return res.status(403).json({ message: 'Access denied' });
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        // console.log(verified);
        req.user = verified;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Invalid token', error: e });
    }
};