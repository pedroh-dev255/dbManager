const authService = require('../services/authService');


async function login(req, res) {
    try {
        const {email, password} = req.body;

        if(!email || !password || email == "" || email == null || password == "" || password == null){
            return res.status(406).json({
                success: false,
                message: "Dados de login não enviados"
            })
        }

        const userData = await authService.login(email, password);

        if(!userData || userData == null){
            return res.status(406).json({
                success: false,
                message: "Email ou senha incorretos"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso",
            userData
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    login
}