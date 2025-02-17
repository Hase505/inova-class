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

exports.get_professor_by_id = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { message: "ID informado é inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();


		const professor = await conn.query("SELECT * FROM professor WHERE id_professor = ?", [id]);
		await conn.commit();

		return res.status(200).json(professor);
	} catch (err) {
		const status_code = err.status || 500;
		if (conn) conn.rollback();

		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.get_disciplina_of_professor_by_id = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { message: "ID inválido", status: 400 }
		}

		conn = await pool.getConnection();

		const disciplinas = await conn.query(
			"SELECT disciplina_professor.id_disciplina, nome, descricao \
			FROM disciplina_professor \
			INNER JOIN disciplina ON disciplina_professor.id_disciplina = disciplina.id_disciplina \
			WHERE disciplina_professor.id_professor = ?",
			[id]
		);

		return res.status(200).json(disciplinas);
	} catch (err) {
		const status_code = err.status || 500;

		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.post_professor = async (req, res) => {
	let conn;
	try {
		const { id_usuario, nome, ra, rfid_tag } = req.body;

		if (!id_usuario || !nome || !ra || !rfid_tag) {
			return res.status(400).json({ error: "Todos os campos são obrigatórios" });
		}

		if (isNaN(id_usuario) || typeof nome !== "string" || isNaN(ra) || typeof (rfid_tag) !== "string") {
			return res.status(400).json({ error: "Dados inválidos" });
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

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

		// Verificar se o RA já foi utilizado
		const existent_ra = await conn.query("SELECT id_professor FROM professor WHERE ra = ?", [ra]);
		if (existent_ra.length > 0) {
			throw { message: "O RA informado já está registrado no sistema", status: 409 };
		}

		// Verificar se RFID_TAG já foi utilizada
		const existent_rfid_tag = await conn.query("SELECT id_professor FROM professor WHERE rfid_tag = ?", [rfid_tag]);
		if (existent_rfid_tag.length > 0) {
			throw { message: "A tag RFID informada já está registrada no sistema", status: 409 };
		}

		await conn.query(
			"INSERT INTO professor (id_usuario, nome, ra, rfid_tag) VALUES (?, ?, ?, ?)",
			[id_usuario, nome, ra, rfid_tag]
		);

		conn.commit();
		res.status(201).json({ message: "Professor cadastrado com sucesso" });
	} catch (err) {
		if (conn) conn.rollback();

		const status_code = err.status || 500;
		res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.put_professor = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;
		const { nome, ra, rfid_tag } = req.body;

		if (!id || !nome || !ra || !rfid_tag) {
			throw { message: "Todos os campos são obrigatórios", status: 400 };
		}
		if (isNaN(id) || typeof (nome) !== "string" || isNaN(ra) || typeof (rfid_tag) !== "string") {
			throw { message: "Dados inválidos", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se o professor existe
		const professor = await conn.query("SELECT * FROM professor WHERE id_professor = ?", [id]);
		if (professor.length === 0) {
			throw { message: "Professor não encontrado", status: 404 };
		}

		const current_professor = professor[0];

		// Verificar se o RA já foi utilizado
		if (ra != current_professor.ra) {
			const existent_ra = await conn.query("SELECT id_professor FROM professor WHERE ra = ?", [ra]);
			if (existent_ra.length > 0) {
				throw { message: "O RA informado já está registrada no sistema", status: 409 };
			}
		}

		// Verificar se RFID_TAG já foi utilizada
		if (rfid_tag != current_professor.rfid_tag) {
			const existent_rfid_tag = await conn.query("SELECT id_professor FROM professor WHERE rfid_tag = ?", [rfid_tag]);
			if (existent_rfid_tag.length > 0) {
				throw { message: "A tag RFID informada já está registrada no sistema", status: 409 };
			}
		}

		// Realizar update das informações
		await conn.query("INSERT INTO professor (nome, ra, rfid_tag) VALUES (?, ?, ?)", [nome, ra, rfid_tag]);
		await conn.commit();

		return res.status(200).json({ message: "Professor atualizado com sucesso" });
	} catch (err) {
		const status_code = err.status;
		if (conn) conn.rollback();

		return res.status(status_code).json({ error: err.message });
	} finally {
		if (conn) conn.release();
	}
}

exports.delete_professor = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (!id) {
			throw { message: "O ID é obrigatório", status: 400 };
		}
		if (isNaN(id)) {
			throw { message: "O ID precisa ser um número", status: 400 };
		}

		conn = await pool.getConnection();
		conn.beginTransaction();

		// Verificar se o professor existe
		const existent_professor = await conn.query("SELECT id_professor FROM professor WHERE id_professor = ?", [id]);
		if (existent_professor.length === 0) {
			throw { message: "Professor não encontrado", status: 404 };
		}

		// Deletar professor
		await conn.query("DELETE FROM professor WHERE id_professor = ?", [id]);
		conn.commit();

		return res.status(200).json({ message: "Professor deletado com sucesso" });
	} catch (err) {
		const status_code = err.status || 500;
		if (conn) conn.rollback();

		return res.status(status_code).json({ error: err.message });
	} finally {
		if (conn) conn.release();
	}
}
module.exports = { ...exports };
