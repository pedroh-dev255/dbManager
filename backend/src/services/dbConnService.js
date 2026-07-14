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

async function connTest(host, porta, usuario,senha) {
    try {
        if (!host?.trim()) {
            throw new Error("Host é obrigatório.");
        }

        if (!usuario?.trim()) {
            throw new Error("Usuário é obrigatório.");
        }

        const server = {
            host,
            port: porta || 3306,
            usuario,
            senha
        };

        await ConnectionManager.query(server, "SELECT 1");
        return `Conexão realizada com sucesso!`;

    } catch (error) {
        throw new Error(error.message);
    }
    
}

async function create(nome, descricao, host, porta, usuario,senha,tipo,ssl_active, ativo) {
    try {
        // Campos obrigatórios
        if (!nome?.trim()) {
            throw new Error("Nome é obrigatório.");
        }

        if (!host?.trim()) {
            throw new Error("Host é obrigatório.");
        }

        if (!usuario?.trim()) {
            throw new Error("Usuário é obrigatório.");
        }

        if (!senha?.trim()) {
            throw new Error("Senha é obrigatória.");
        }

        const fields = [];
        const values = [];
        const placeholders = [];

        const addField = (field, value) => {
            if (value !== undefined && value !== null && value !== "") {
                fields.push(`\`${field}\``);
                placeholders.push("?");
                values.push(value);
            }
        };

        addField("nome", nome);
        addField("descricao", descricao);
        addField("host", host);
        addField("porta", porta);
        addField("usuario", usuario);
        addField("senha", senha);
        addField("tipo", tipo);
        addField("ssl_active", ssl_active);
        addField("ativo", ativo);

        const sql = `
            INSERT INTO conexoes
            (${fields.join(", ")})
            VALUES
            (${placeholders.join(", ")})
        `;

        const [result] = await pool.query(sql, values);

        return {
            id: result.insertId,
            message: "Conexão criada com sucesso."
        };

    } catch (error) {
        throw new Error(`Erro ao criar conexão: ${error.message}`);
    }
}



module.exports = {
    list,
    connTest,
    create
}