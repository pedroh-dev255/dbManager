const ConnectionManager = require('./ConnManager');
const pool = require("../configs/db");

async function listDb(serverId) {
    try {
        const [rows] = await pool.query(
            `SELECT host, porta, usuario, senha, ativo
             FROM conexoes
             WHERE id = ?`,
            [serverId]
        );

        if (rows.length === 0) {
            return null;
        }

        const server = rows[0];

        if (!server.ativo) {
            throw new Error("Servidor desativado");
        }

        const databases = await ConnectionManager.query(
            server,
            "SHOW DATABASES"
        );

        return databases.map(database => Object.values(database)[0]);

    } catch (error) {
        throw error;
    }
}

async function listDbData(serverId, database) {
    try {
        const [rows] = await pool.query(
            `SELECT host, porta, usuario, senha, ativo
             FROM conexoes
             WHERE id = ?`,
            [serverId]
        );

        if (rows.length === 0) {
            throw new Error("Conexão não encontrada.");
        }

        const server = rows[0];

        if (!server.ativo) {
            throw new Error("Servidor desativado.");
        }

        // Verifica se o banco existe
        const databases = await ConnectionManager.query(
            server,
            "SHOW DATABASES"
        );

        const exists = databases.some(db => db.Database === database);

        if (!exists) {
            throw new Error(`O banco '${database}' não existe neste servidor.`);
        }

        // Lista as tabelas do banco
        const tables = await ConnectionManager.query(
            server,
            `SHOW TABLES FROM \`${database}\``
        );

        const views = await ConnectionManager.query(
            server,
            `SHOW FULL TABLES FROM ${database} WHERE Table_type = 'VIEW'`
        );

        const functions = await ConnectionManager.query(
            server,
            `SHOW FUNCTION STATUS WHERE Db = '${database}'`
        );

        const triggers = await ConnectionManager.query(
            server,
            `SHOW TRIGGERS FROM ${database}`
        );

        return {
            "tables": tables.map(table => Object.values(table)[0]),
            "views": views.map(view => Object.values(view)[0]),
            "functions": functions.map(functionss => Object.values(functionss)[0]),
            "triggers": triggers.map(trigger => Object.values(trigger)[0])
        }

    } catch (error) {
        throw error;
    }
}

async function selectTable(serverId, database, table) {
    try {
        const [rows] = await pool.query(
            `SELECT host, porta, usuario, senha, ativo
             FROM conexoes
             WHERE id = ?`,
            [serverId]
        );

        if (rows.length === 0) {
            throw new Error("Conexão não encontrada.");
        }

        const server = rows[0];

        if (!server.ativo) {
            throw new Error("Servidor desativado.");
        }

        // Verifica se o banco existe
        const databases = await ConnectionManager.query(
            server,
            "SHOW DATABASES"
        );

        const existsDatabase = databases.some(db => db.Database === database);

        if (!existsDatabase) {
            throw new Error(`O banco '${database}' não existe neste servidor.`);
        }

        // Verifica se a tabela existe
        const tables = await ConnectionManager.query(
            server,
            `
            SELECT TABLE_NAME
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = ?
            `,
            [database]
        );

        const existsTable = tables.some(t => t.TABLE_NAME === table);

        if (!existsTable) {
            throw new Error(`A tabela '${table}' não existe em '${database}'.`);
        }

        // Busca os dados da tabela
        const data = await ConnectionManager.query(
            server,
            `SELECT * FROM \`${database}\`.\`${table}\``
        );

        return data;

    } catch (error) {
        throw error;
    }
}

async function sqlfree(serverId, database, sql) {
     try {
        const [rows] = await pool.query(
            `SELECT host, porta, usuario, senha, ativo
             FROM conexoes
             WHERE id = ?`,
            [serverId]
        );

        if (rows.length === 0) {
            throw new Error("Conexão não encontrada.");
        }

        const server = rows[0];

        if (!server.ativo) {
            throw new Error("Servidor desativado.");
        }

        const result = await ConnectionManager.query(
            {...server, database},
            sql
        );

        return result;
    }catch(error){
        throw error;
    }
}


module.exports = {
    listDb,
    listDbData,
    selectTable,
    sqlfree
}