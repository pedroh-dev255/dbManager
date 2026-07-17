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

async function listDbDetails(serverId) {
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
            `
            SELECT
                s.SCHEMA_NAME AS database_name,
                s.DEFAULT_CHARACTER_SET_NAME AS charset,
                s.DEFAULT_COLLATION_NAME AS collation,
                COUNT(t.TABLE_NAME) AS tables,
                COALESCE(SUM(t.DATA_LENGTH + t.INDEX_LENGTH),0) AS size_bytes
            FROM information_schema.SCHEMATA s
            LEFT JOIN information_schema.TABLES t
                ON t.TABLE_SCHEMA = s.SCHEMA_NAME
            WHERE s.SCHEMA_NAME NOT IN (
                'information_schema',
                'performance_schema',
                'mysql',
                'sys'
            )
            GROUP BY
                s.SCHEMA_NAME,
                s.DEFAULT_CHARACTER_SET_NAME,
                s.DEFAULT_COLLATION_NAME
            ORDER BY s.SCHEMA_NAME;
            `
        );

        function formatBytes(bytes) {
            if (!bytes) return "0 B";

            const units = ["B", "KB", "MB", "GB", "TB"];
            let i = 0;

            while (bytes >= 1024 && i < units.length - 1) {
                bytes /= 1024;
                i++;
            }

            return `${bytes.toFixed(bytes >= 10 ? 0 : 1)} ${units[i]}`;
        }

        return databases.map(db => ({
            database: db.database_name,
            charset: db.charset,
            collation: db.collation,
            tables: Number(db.tables),
            size: formatBytes(Number(db.size_bytes)),
            sizeBytes: Number(db.size_bytes)
        }));

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

        // ===========================
        // Tabelas
        // ===========================

        const tables = await ConnectionManager.query(
            server,
            `
            SELECT
                TABLE_NAME           AS name,
                ENGINE               AS engine,
                TABLE_ROWS           AS totalRows,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb,
                TABLE_COLLATION      AS collation,
                CREATE_TIME          AS created,
                UPDATE_TIME          AS updated,
                AUTO_INCREMENT       AS autoIncrement,
                TABLE_COMMENT        AS comment
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = ?
              AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
            `,
            [database]
        );

        // ===========================
        // Views
        // ===========================

        const views = await ConnectionManager.query(
            server,
            `
            SELECT
                TABLE_NAME AS name,
                CHECK_OPTION,
                IS_UPDATABLE,
                DEFINER,
                SECURITY_TYPE
            FROM information_schema.VIEWS
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME
            `,
            [database]
        );

        // ===========================
        // Functions
        // ===========================

        const functions = await ConnectionManager.query(
            server,
            `
            SELECT
                ROUTINE_NAME AS name,
                ROUTINE_TYPE,
                DTD_IDENTIFIER AS returns,
                CREATED,
                LAST_ALTERED,
                DEFINER
            FROM information_schema.ROUTINES
            WHERE ROUTINE_SCHEMA = ?
              AND ROUTINE_TYPE = 'FUNCTION'
            ORDER BY ROUTINE_NAME
            `,
            [database]
        );

        // ===========================
        // Triggers
        // ===========================

        const triggers = await ConnectionManager.query(
            server,
            `
            SELECT
                TRIGGER_NAME AS name,
                EVENT_MANIPULATION AS event,
                EVENT_OBJECT_TABLE AS tableName,
                ACTION_TIMING AS timing,
                CREATED,
                DEFINER
            FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = ?
            ORDER BY TRIGGER_NAME
            `,
            [database]
        );

        return {
            tables,
            views,
            functions,
            triggers
        };

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

async function sqlfree(serverId, database, page = 1, sql) {
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

        const PAGE_SIZE = 10;

        let query = sql.trim().replace(/;$/, "");

        let totalPages = 1;

        // Apenas para SELECT
        if (/^select\b/i.test(query)) {
            if (!/\blimit\b/i.test(query)) {
                // Conta o total de registros
                const countSql = `
                    SELECT COUNT(*) AS total
                    FROM (${query}) AS tmp
                `;

                const countResult = await ConnectionManager.query(
                    { ...server, database },
                    countSql
                );

                const totalRows = Number(countResult[0]?.total ?? 0);

                totalPages = Math.max(
                    1,
                    Math.ceil(totalRows / PAGE_SIZE)
                );

                const offset = (page - 1) * PAGE_SIZE;

                query += ` LIMIT ${PAGE_SIZE} OFFSET ${offset}`;
            }
        }

        const result = await ConnectionManager.query(
            { ...server, database },
            query
        );

        // INSERT / UPDATE / DELETE
        if (!Array.isArray(result)) {
            return {
                success: true,
                columns: [],
                rows: [],
                rowsSize: [1, 1],
                info: result,
            };
        }

        const columns =
            result.length > 0
                ? Object.keys(result[0])
                : [];

        const data = result.map(row =>
            columns.map(col => row[col])
        );

        return {
            columns,
            rowsSize: [page, totalPages],
            rows: data,
        };
    } catch (error) {
        throw error;
    }
}


module.exports = {
    listDb,
    listDbDetails,
    listDbData,
    selectTable,
    sqlfree
}