require('dotenv').config();
const mariadb = require('mariadb');

// Criando pool de conexões
const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	port: process.env.DB_PORT,
	connectionLimit: 5
});

async function testConnection() {
	let conn;
	try {
		conn = await pool.getConnection();
		console.log("Conectado!");
	} catch (err) {
		console.error("Erro ao conectar: ", err);
	} finally {
		if (conn) conn.end();
	}
}

// Testar conexão ao iniciar
testConnection();

module.exports = pool;

