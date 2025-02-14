const pool = require('../database/db');

exports.get_alunos = async (req, res) => {
	let conn;
	try {
		const { ano_letivo } = req.query;
		if (ano_letivo && isNaN(ano_letivo)) {
			return res.status(400).json({ error: "O ano letivo deve ser um número válido" });
		}

		conn = await pool.getConnection();

		let query = "SELECT * FROM aluno";
		let values = [];

		if (ano_letivo) {
			query += " WHERE ano_letivo = ?";
			values.push(ano_letivo);
		}

		const alunos = await conn.query(query, values);

		return res.status(200).json(alunos);
	} catch (err) {
		return res.status(500).json({ error: "Erro interno no servidor" });
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

		if (isNaN(id_usuario) || isNaN(id_curso) || typeof nome !== "string" || isNaN(ra) || typeof (rfid_tag) !== "string" || isNaN(ano_letivo)) {
			return res.status(400).json({ error: "Dados inválidos" });
		}

		if (ano_letivo < 1 || ano_letivo > 4) {
			return res.status4 = (400).json({ error: "Ano letivo inválido" });
		}

		conn = await pool.getConnection();
		conn.beginTransaction();

		// Verificar se o usuário existe
		const usuario = await conn.query("SELECT id_usuario from usuario WHERE id_usuario = ?", [id_usuario]);
		if (usuario.length === 0) {
			throw { message: "O usuário não existe", status: 404 };
		}

		// Verificar se o usuário já foi cadastrado
		const existent_usuario_aluno = await conn.query("SELECT id_usuario FROM aluno WHERE id_usuario = ?", [id_usuario]);
		if (existent_usuario_aluno.length > 0) {
			throw { message: "O usuário já foi registrado como aluno", status: 409 };
		}
		const existent_usuario_professor = await conn.query("SELECT id_usuario FROM professor WHERE id_usuario = ?", [id_usuario]);
		if (existent_usuario_professor.length > 0) {
			throw { message: "O usuário já foi registrado como professor", status: 409 };
		}

		// Veriificar se o curso existe
		const existent_curso = await conn.query("SELECT id_curso FROM curso WHERE id_curso = ?", [id_curso]);
		if (existent_curso.length === 0) {
			throw { message: "O curso informado não existe ", status: 404 };
		}

		// Verificar se o RA já foi utilizado
		const existent_ra = await conn.query("SELECT id_aluno FROM aluno WHERE ra = ?", [ra]);
		if (existent_ra.length > 0) {
			throw { message: "O RA informado já está registrado no sistema", status: 409 };
		}

		// Verificar se RFID_TAG já foi utilizada
		const existent_rfid_tag = await conn.query("SELECT id_aluno FROM aluno WHERE rfid_tag = ?", [rfid_tag]);
		if (existent_rfid_tag.length > 0) {
			throw { message: "A tag RFID informada já está registrada no sistema", status: 409 };
		}

		await conn.query(
			"INSERT INTO aluno (id_usuario, id_curso, nome, ra, rfid_tag, ano_letivo) VALUES (?, ?, ?, ?, ?, ?)",
			[id_usuario, id_curso, nome, ra, rfid_tag, ano_letivo]
		);

		conn.commit();
		res.status(201).json({ message: "Aluno cadastrado com sucesso" });
	} catch (err) {
		if (conn) conn.rollback();

		const status_code = err.status || 500;
		res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}

}

exports.get_alunos_by_id = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;
		if (isNaN(id)) {
			return res.status(400).json({ error: "ID inválido" });
		}

		conn = await pool.getConnection();
		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		res.status(200).json(aluno[0]);
	} catch (err) {
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

		if (!nome || !ra || !id_curso || !ano_letivo || !rfid_tag) {
			return res.status(400).json({ error: "Todos os campos são obrigatórios" });
		}

		if (isNaN(id) || typeof (nome) !== "string" || isNaN(ra) || isNaN(id_curso) || isNaN(ano_letivo) || typeof (rfid_tag) !== "string") {
			return res.status(400).json({ error: "Dados inválidos" });
		}

		if (ano_letivo < 0 || ano_letivo > 4) {
			return res.status(400).json({ error: "Ano letivo inválido" });
		}

		conn = await pool.getConnection();

		// Verificar se o aluno existe
		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);
		if (aluno.length === 0) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		const current_aluno = aluno[0];

		// Verificar se o curso é válido
		const existent_curso = await conn.query("SELECT id_curso FROM curso WHERE id_curso = ?", [id_curso]);
		if (existent_curso.length === 0) {
			return res.status(400).json({ error: "O curso informado é inválido" });
		}

		// Verificar se o RA já foi utilizado
		if (ra != current_aluno.ra) {
			const existent_ra = await conn.query("SELECT id_aluno FROM aluno WHERE ra = ?", [ra]);
			if (existent_ra.length > 0) {
				return res.status(409).json({ error: "O RA informado já está registrado no sistema" });
			}
		}

		// Verificar se RFID_TAG já foi utilizada
		if (rfid_tag !== current_aluno.rfid_tag) {
			const existent_rfid_tag = await conn.query("SELECT id_aluno FROM aluno WHERE rfid_tag = ?", [rfid_tag]);
			if (existent_rfid_tag.length > 0) {
				return res.status(409).json({ error: "A tag RFID informada já está registrada no sistema" });
			}
		}

		// Realizar update das informações
		await conn.query(
			"UPDATE aluno SET nome = ?, ra = ?, id_curso = ?, ano_letivo = ?, rfid_tag = ? WHERE id_aluno = ?",
			[nome, ra, id_curso, ano_letivo, rfid_tag, id]
		);

		return res.status(200).json({ message: "Aluno atualizado com sucesso" });

	} catch (err) {
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

		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		await conn.query("DELETE FROM aluno WHERE id_aluno = ?", [id]);

		res.status(200).json({ message: "Aluno deletado com sucesso" });
	} catch (err) {
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

		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		let presencas;

		if (id_disciplina) {
			presencas = await conn.query(
				"SELECT presenca.*, \
				aula.id_disciplina, \
				disciplina.nome \
				FROM presenca \
				JOIN aula \
				ON presenca.id_aula=aula.id_aula \
				JOIN disciplina \
				ON aula.id_disciplina = disciplina.id_disciplina \
				WHERE presenca.id_aluno = ? \
				AND disciplina.id_disciplina = ?;",
				[id, id_disciplina]
			);
		} else {
			presencas = await conn.query(`SELECT * FROM presenca WHERE id_aluno = ?`, [id]);
		}

		res.status(200).json({ aluno_id: id, presencas });
	} catch (err) {
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

		const aluno = await conn.query(`SELECT * FROM aluno WHERE id_aluno = ?`, [id]);

		if (aluno.length === 0) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		const disciplinas = await conn.query(
			"SELECT disciplina.* \
			FROM disciplina \
			JOIN disciplina_aluno \
			ON disciplina.id_disciplina = disciplina_aluno.id_disciplina \
			JOIN aluno \
			ON disciplina_aluno.id_aluno = aluno.id_aluno \
			WHERE aluno.id_aluno = ?",
			[id]
		);

		res.status(200).json({ aluno_id: id, disciplinas });
	} catch (err) {
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

		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			return res.status(404).json({ error: "Aluno não encontrado" });
		}

		const curso = await conn.query(
			"SELECT curso.* \
			FROM curso \
			JOIN aluno \
			ON curso.id_curso = aluno.id_curso \
			WHERE aluno.id_aluno = ?",
			[id]
		);

		res.status(200).json({ aluno_id: id, curso });
	} catch (err) {
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

module.exports = { ...exports };
