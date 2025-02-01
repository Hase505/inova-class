const pool = require('../database/db');

exports.get_professores = async (req, res) => {
	let conn;
	try {
		conn = await pool.getConnection();
		const rows = await conn.query("SELECT * FROM professor");
		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	} finally {
		if (conn) conn.release();
	}
}

module.exports = { ...exports };
