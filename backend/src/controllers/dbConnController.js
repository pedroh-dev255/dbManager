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


module.exports = {
    list,

}