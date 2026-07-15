const dbService = require('../services/dbService');

async function listDb(req, res) {
    try {
        const { serverId } = req.body;

        if(!serverId || serverId == "" || serverId === null){
            return res.status(406).json({
                success: false,
                message: "Nenhuma conexão selecionada"
            });
        }

        const dbList = await dbService.listDb(Number(serverId));

        if(!dbList || dbList === null){
            return res.status(404).json({
                success: false,
                message: "Nenhum banco encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "bancos encontradas",
            dbList
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Erro: ${error.message}`
        });
    }
}

async function listDbDetails(req, res) {
    try {
        const { serverId } = req.body;

        if(!serverId || serverId == "" || serverId === null){
            return res.status(406).json({
                success: false,
                message: "Nenhuma conexão selecionada"
            });
        }
        const dblist = await dbService.listDbDetails(serverId);

         if(!dblist || dblist === null){
            return res.status(404).json({
                success: false,
                message: "Nenhum banco encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            message: "bancos encontradas",
            databases: dblist
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Erro: ${error.message}`
        });
    }
}


async function listDbData(req, res) {
    try {
        const { serverId, database } = req.body;

        if(!serverId || serverId == "" || serverId === null || !database || database == "" || database === null){
            return res.status(406).json({
                success: false,
                message: "Nenhum banco selecionado"
            });
        }

        const data = await dbService.listDbData(serverId, database);

        return res.status(200).json({
            success: true,
            message: "Dados encontrados encontradas",
            data
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Erro: ${error.message}`
        });
    }
}


async function selectTable(req, res) {
    try {
        const { serverId, database, table } = req.body;

        if(!serverId || serverId == "" || serverId === null || !database || database == "" || database === null, !table || table == "", table === null){
            return res.status(406).json({
                success: false,
                message: "Nenhum banco selecionado"
            });
        }

        const data = await dbService.selectTable(serverId, database, table);

        return res.status(200).json({
            success: true,
            message: "Dados Encontradas",
            data
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Erro: ${error.message}`
        });
    }
    
}

async function sqlfree(req,res) {
    try {
        const { serverId, database, page, sql } = req.body;

        if(!serverId || serverId == "" || serverId === null || !sql || sql == "" || sql === null){
            return res.status(406).json({
                success: false,
                message: "Nenhum banco selecionado"
            });
        }

        const result = await dbService.sqlfree(serverId, database, page, sql);

        return res.status(200).json({
            success: true,
            message: "Resultado da consulta",
            data: result
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Erro ao realizar consulta`,
            data: {
                columns: ['ERROR'],
                rowsSize: [1, 1],
                rows: [[error.message]],
            }
        });
    }
}

module.exports = {
    listDb,
    listDbData,
    listDbDetails,
    selectTable,
    sqlfree
}