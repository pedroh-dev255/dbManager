const dbConnService = require('../services/dbConnService');

async function list(req, res) {
    try {
        const connList = await dbConnService.list();

        if(!connList || connList === null || connList === ""){
            return res.status(404).json({
                success: false,
                message: "Nenhum dado encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Connexões encontradas",
            connData: connList
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Erro Interno: ${error.message}`
        });
    }
}


async function create(req, res) {
    try {
        const { nome, descricao, host, porta, usuario,senha,tipo,ssl_active, ativo } = req.body;

        if(!nome || !host || !porta){
            return res.status(406).json({
                success: false,
                message: "Dados obrigatorios não enviados"
            });
        }

        const result = await dbConnService.create(nome, descricao, host, porta, usuario,senha,tipo,ssl_active, ativo);

        if(!result || result === null || result == false){
            return res.status(406).json({
                success: false,
                message: `Cadastro não realizado`
            });
        }

        return res.status(201).json({
            success: true,
            message: "Cadastro realizado com sucesso."
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Erro Interno: ${error.message}`
        });
    }
    
}

module.exports = {
    list,
    create
}