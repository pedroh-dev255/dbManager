const mysql = require("mysql2/promise");

class ConnectionManager {

    static async getConnection(server){

        return mysql.createPool({
            host: server.host,
            port: server.port,
            user: server.usuario,
            password: server.senha,
            database: server.database,
            waitForConnections: true,
            connectionLimit: 10
        });

    }

    static async query(server, sql, params = []){

        const pool = await this.getConnection(server);

        const [rows] = await pool.query(sql, params);

        await pool.end();

        return rows;

    }

}

module.exports = ConnectionManager;