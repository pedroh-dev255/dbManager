const pool = require('../configs/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function login(email, password) {
    try {
        const [result] = await pool.query("select * from users where email = ?", [email]);

         if (result.length === 0) {
            return null;
        }
        const user = result[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        //retirar senha do objeto user;
        delete user.password;

        // Gerar token JWT
        const token = jwt.sign({ id: user.id, name: user.nome, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        user.token = token;
        
        
        return user;
    } catch (error) {
        throw new Error(error.message)
    }
}

module.exports = {
    login
}