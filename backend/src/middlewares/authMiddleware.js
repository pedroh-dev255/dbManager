//authMiddleware
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

async function authMiddleware(req, res, next) {
    try {
        const authHeader =
        req.headers['authorization'];

        const token =
            authHeader &&
            authHeader.split(' ')[1];

        if (!token) {
            console.log("token invalido")
            return res.status(401).json({
                success: false,
                message: 'Acesso não autorizado'
            });
        }


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(406).json({
            success: false,
            message: 'Acesso não autorizado'
        });
    }
    
}
module.exports = authMiddleware;