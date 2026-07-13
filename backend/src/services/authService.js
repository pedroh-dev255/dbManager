const pool = require('../configs/db');

async function login(email, password) {
    try {
        const [result] = await pool.query("select * from users where email = ?", [email]);

        if(result.length <= 0){
            return null
        }

        
        userData = {nome: 'Pedro'}
        
        return userData;
    } catch (error) {
        throw new Error("Erro ao Realizar login")
    }
}

module.exports = {
    login
}