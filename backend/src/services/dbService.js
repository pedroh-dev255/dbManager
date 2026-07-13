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

async function listTable(serverId, database) {
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

        return tables.map(table => Object.values(table)[0]);

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
    listTable,
    selectTable,
    sqlfree
}