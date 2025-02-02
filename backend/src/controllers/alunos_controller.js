const pool = require('../database/db');

exports.get_alunos = async (req, res) => {
	let conn;
	try {
		const { ano_letivo } = req.query;
		if (ano_letivo && isNaN(ano_letivo)) {
			return res.status(400).json({ error: "O ano letivo deve ser um número válido" });
		}

		conn = await pool.getConnection();

		let query = `SELECT * FROM aluno`;
		let values = [];

		if (ano_letivo) {
			query += ` WHERE ano_letivo = ?`;
			values.push(ano_letivo);
		}

		const rows = await conn.query(query, values);

		res.json(rows);

	} catch (err) {
		console.error("Erro ao buscar alunos:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.post_alunos = async (req, res) => {
	let conn;
	try {
		const { id_usuario, id_curso, nome, ra, rfid_tag, ano_letivo } = req.body;

		if (!id_usuario || !id_curso || !nome || !ra || !rfid_tag || !ano_letivo) {
			return res.status(400).json({ error: "Todos os campos são obrigatórios" });
		}

		if (typeof nome !== "string" || isNaN(ra) || isNaN(rfid_tag) || isNaN(ano_letivo)) {
			return res.status(400).json({ error: "Dados inválidos" });
		}

		conn = await pool.getConnection();

		const result = await conn.query(
			`INSERT INTO aluno (id_usuario, id_curso, nome, ra, rfid_tag, ano_letivo) VALUES (?, ?, ?, ?, ?, ?)`,
			[id_usuario, id_curso, nome, ra, rfid_tag, ano_letivo]
		);

		res.status(201).json({ message: "Aluno cadastrado com sucesso", id_aluno: result.insertId });

	} catch (err) {
		console.error("Erro ao cadastrar aluno:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}

}

exports.get_alunos_by_id = async (req, res) => {
	let conn;
	try {
		const alunoId = parseInt(req.params.id, 10);
		if (isNaN(alunoId)) {
			return res.status(400).json({ error: "ID inválido" });
		}

		conn = await pool.getConnection();
		const rows = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [alunoId]);

		if (rows.length === 0) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		res.json(rows[0]);
	} catch (err) {
		console.error("Erro ao buscar aluno:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.put_alunos = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;
		const { nome, ra, id_curso, ano_letivo, rfid_tag } = req.body;

		if (isNaN(id)) {
			return res.status(400).json({ error: "ID do aluno deve ser um número válido" });
		}

		if (!nome || !ra || !id_curso || !ano_letivo) {
			return res.status(400).json({ error: "Todos os campos são obrigatórios" });
		}

		conn = await pool.getConnection();

		const [existing] = await conn.query(`SELECT * FROM aluno WHERE id_aluno = ?`, [id]);

		if (!existing.length) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		const updateQuery = `
      UPDATE aluno
      SET nome = ?, ra = ?, id_curso = ?, ano_letivo = ?, rfid_tag = ?
      WHERE id_aluno = ?
    `;

		await conn.query(updateQuery, [nome, ra, id_curso, ano_letivo, rfid_tag, id]);

		res.json({ message: "Aluno atualizado com sucesso" });

	} catch (err) {
		console.error("Erro ao atualizar aluno:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.delete_alunos = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			return res.status(400).json({ error: "ID do aluno deve ser um número válido" });
		}

		conn = await pool.getConnection();

		const [existing] = await conn.query(`SELECT * FROM aluno WHERE id_aluno = ?`, [id]);

		if (!existing.length) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		await conn.query(`DELETE FROM aluno WHERE id_aluno = ?`, [id]);

		res.json({ message: "Aluno deletado com sucesso" });
	} catch (err) {
		console.error("Erro ao deletar aluno:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.get_presencas_by_aluno_id = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;
		const { id_disciplina } = req.query;

		if (isNaN(id)) {
			return res.status(400).json({ error: "ID do aluno deve ser um número válido" });
		}

		if (id_disciplina && isNaN(id_disciplina)) {
			return res.status(400).json({ error: "O ID da disciplina deve ser um número válido" });
		}

		conn = await pool.getConnection();

		const [existing] = await conn.query(`SELECT * FROM aluno WHERE id_aluno = ?`, [id]);

		if (existing === undefined) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		let presencas;

		if (id_disciplina) {
			[presencas] = await conn.query("SELECT presenca.*, aula.id_disciplina, disciplina.nome FROM presenca JOIN aula ON presenca.id_aula=aula.id_aula JOIN disciplina ON aula.id_disciplina = disciplina.id_disciplina WHERE presenca.id_aluno = ? AND disciplina.id_disciplina = ?;", [id, id_disciplina]);
		} else {
			[presencas] = await conn.query(`SELECT * FROM presenca WHERE id_aluno = ?`, [id]);
		}

		res.json({ aluno_id: id, presencas });
	} catch (err) {
		console.error("Erro ao buscar presenças:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.get_disciplina_by_aluno_id = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			return res.status(400).json({ error: "ID do aluno deve ser um número válido" });
		}

		conn = await pool.getConnection();

		const [existing] = await conn.query(`SELECT * FROM aluno WHERE id_aluno = ?`, [id]);

		if (existing === undefined) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		const [disciplinas] = await conn.query('SELECT disciplina.* FROM disciplina JOIN disciplina_aluno ON disciplina.id_disciplina = disciplina_aluno.id_disciplina JOIN aluno ON disciplina_aluno.id_aluno = aluno.id_aluno WHERE aluno.id_aluno = ?', [id]);

		res.json({ aluno_id: id, disciplinas });
	} catch (err) {
		console.error("Erro ao buscar disciplinas:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.get_curso_by_aluno_id = async (req, res) => {
	let conn;
	try {
		let { id } = req.params;

		if (isNaN(id)) {
			return res.status(400).json({ error: "ID do aluno deve ser um número válido" });
		}

		conn = await pool.getConnection();

		const [existing] = await conn.query(`SELECT * FROM aluno WHERE id_aluno = ?`, [id]);

		if (existing === undefined) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		const [curso] = await conn.query('SELECT curso.* FROM curso JOIN aluno ON curso.id_curso = aluno.id_curso WHERE aluno.id_aluno = ?', [id]);

		res.json({ aluno_id: id, curso });
	} catch (err) {
		console.error("Erro ao buscar curso:", err);
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}



module.exports = { ...exports };
