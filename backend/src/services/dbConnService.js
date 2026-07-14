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

async function create(nome, descricao, host, porta, usuario,senha,tipo,ssl_active, ativo) {
    try {
        
    } catch (error) {
        throw new Error("Erro ao criar Conexão: ", error.message);
    }
    
}



module.exports = {
    list,
    create
}