const pool = require('../database/db');

exports.get_aulas = async (req, res) => {
	let conn;
	try {
		conn = await pool.getConnection();
		const aulas = await conn.query("SELECT * FROM aula");

		return res.status(200).json({ aulas });
	} catch (err) {
		return res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.get_aulas_by_id = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { message: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();

		const [aulas] = await conn.query("SELECT * FROM aula WHERE id_aula = ?", [id]);

		return res.status(200).json(aulas);
	} catch (err) {
		const status_code = err.status || 500;
		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.get_aulas_by_disciplina = async (req, res) => {
	let conn;
	try {
		const { id_disciplina } = req.query;

		if (isNaN(id_disciplina)) {
			throw { message: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();

		const aulas = await conn.query(
			"SELECT id_aula, nome_aula, aula.id_sala, bloco, espaco, numero_sala, inicio, fim \
			FROM aula \
			INNER JOIN sala ON aula.id_sala = sala.id_sala \
			WHERE aula.id_disciplina = ?",
			[id_disciplina]
		);

		res.status(200).json({ aulas });

	} catch (err) {
		const status_code = err.status || 500;
		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

module.exports = { ...exports };
