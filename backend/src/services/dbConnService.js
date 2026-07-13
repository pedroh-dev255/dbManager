const pool = require('../configs/db');
const ConnectionManager = require('./ConnManager');

async function list() {
    try {
        const [result] = await pool.query('SELECT id, nome, descricao, host, porta, usuario, tipo, ssl_active, ativo, criado_em FROM conexoes');
        
        if(result.length <= 0){
            return null
        }

        return result;

    } catch (error) {
        throw new Error("Erro ao listar Conexões");
    }
}



module.exports = {
    list,
}