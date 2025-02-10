const pool = require("../database/db");

exports.get_presenca_by_id = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { message: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		const presenca = await conn.query("SELECT * FROM presenca WHERE id_presenca = ?", [id]);

		if (presenca.length === 0) {
			throw { message: "Presença não encontrada", status: 404 };
		}

		return res.status(200).json({ presenca });
	} catch (err) {
		const status_code = err.status || 500;
		if (conn) await conn.rollback();

		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.post_presenca = async (req, res) => {
	let conn;

	try {
		const { rfid_tag, id_sala } = req.body;

		// Verifica se os valores informados são válidos
		if (!rfid_tag || !id_sala) {
			return res.status(400).json({ error: "Todos os valores são obrigatórios" });
		}
		if (typeof (rfid_tag) !== "string" || isNaN(id_sala)) {
			return res.status(400).json({ error: "Os dados são inválidos" });
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verifica se a tag informada está associada a algum aluno
		const aluno = await conn.query("SELECT id_aluno FROM aluno WHERE rfid_tag = ?", [rfid_tag]);
		if (aluno.length === 0) {
			throw { message: "RFID não encontrado", status: 404 };
		}
		const { id_aluno } = aluno[0];

		// Verifica se há alguma aula ocorrendo na sala informada no horário e dia atuais
		const aula = await conn.query("SELECT id_aula, id_disciplina FROM aula WHERE id_sala = ? AND NOW() BETWEEN inicio and fim LIMIT 1", [id_sala]);
		if (aula.length === 0) {
			throw { message: "Nenhuma aula está ocorrendo nesta sala", status: 404 };
		}
		const { id_aula, id_disciplina } = aula[0];

		// Verifica se o aluno pertence à disciplina
		const disciplina_aluno = await conn.query("SELECT id_disciplina_aluno FROM disciplina_aluno WHERE id_aluno = ? AND id_disciplina = ?", [id_aluno, id_disciplina]);
		if (disciplina_aluno.length === 0) {
			throw { message: "O aluno não pertence a disciplina", status: 403 };
		}

		// Verifica se a presença já foi registrada
		const presenca = await conn.query("SELECT id_presenca FROM presenca WHERE id_aluno = ? AND id_aula = ?", [id_aluno, id_aula]);
		if (presenca.length > 0) {
			throw { message: "A presença já foi registrada", status: 409 };
		}

		await conn.query("INSERT into presenca (id_aluno, id_aula, presente) VALUES (?, ?, true)", [id_aluno, id_aula]);
		await conn.commit();

		return res.status(201).json({ message: "Presença registrada com sucesso" });
	} catch (err) {
		await conn.rollback();
		const status_code = err.status || 500;

		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release;
	}
}

module.exports = { ...exports };
