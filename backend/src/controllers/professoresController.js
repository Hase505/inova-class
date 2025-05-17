const pool = require('../database/db');

exports.getProfessores = async (req, res) => {
	let conn;

	try {
		conn = await pool.getConnection();

		const professores = await conn.query("SELECT * FROM professor");

		return res.status(200).json(professores);
	} catch (erro) {
		return res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getProfessorById = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID informado é inválido", status: 400 };
		}

		conn = await pool.getConnection();

		const professor = await conn.query("SELECT * FROM professor WHERE id_professor = ?", [id]);
		if(professor.length === 0){
			throw {mensagem: "ID não encontrado", status: 404 };
		}

		return res.status(200).json(professor);
	} catch (erro) {
		const statusCode = erro.status || 500;
		if (conn) conn.rollback();

		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.getDisciplinaOfProfessorById = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 }
		}

		conn = await pool.getConnection();

		const disciplinas = await conn.query(
			"SELECT disciplina_professor.id_disciplina, nome, descricao, url_imagem \
			FROM disciplina_professor \
			INNER JOIN disciplina ON disciplina_professor.id_disciplina = disciplina.id_disciplina \
			WHERE disciplina_professor.id_professor = ?",
			[id]
		);

		return res.status(200).json(disciplinas);
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.postProfessor = async (req, res) => {
	let conn;

	try {
		const { id_usuario: idUsuario, nome } = req.body;

		if (!idUsuario || !nome) {
			return res.status(400).json({ error: "Todos os campos são obrigatórios" });
		}

		if (isNaN(idUsuario) || typeof nome !== "string") {
			return res.status(400).json({ error: "Dados inválidos" });
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se o usuário existe
		const usuario = await conn.query("SELECT id_usuario from usuario WHERE id_usuario = ?", [idUsuario]);
		if (usuario.length === 0) {
			throw { mensagem: "O usuário não existe", status: 404 };
		}

		// Verificar se o usuário já foi cadastrado
		const usuarioAlunoExiste = await conn.query("SELECT id_usuario FROM aluno WHERE id_usuario = ?", [idUsuario]);
		if (usuarioAlunoExiste.length > 0) {
			throw { mensagem: "O usuário já foi registrado como aluno", status: 409 };
		}
		const usuarioProfessorExiste = await conn.query("SELECT id_usuario FROM professor WHERE id_usuario = ?", [idUsuario]);
		if (usuarioProfessorExiste.length > 0) {
			throw { mensagem: "O usuário já foi registrado como professor", status: 409 };
		}

		await conn.query(
			"INSERT INTO professor (id_usuario, nome) VALUES (?, ?)",
			[idUsuario, nome]
		);

		await conn.commit();
		return res.status(201).json({ mensagem: "Professor cadastrado com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.putProfessor = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;
		const { nome } = req.body;

		if (!id || !nome) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}
		if (isNaN(id) || typeof (nome) !== "string") {
			throw { mensagem: "Dados inválidos", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se o professor existe
		const professor = await conn.query("SELECT * FROM professor WHERE id_professor = ?", [id]);
		if (professor.length === 0) {
			throw { mensagem: "Professor não encontrado", status: 404 };
		}

		// Realizar update das informações
		await conn.query("INSERT INTO professor (nome) VALUES (?)", [nome]);
		await conn.commit();

		return res.status(200).json({ mensagem: "Professor atualizado com sucesso" });
	} catch (erro) {
		const statusCode = erro.status;
		if (conn) await conn.rollback();

		return res.status(statusCode).json({ error: erro.mensagem });
	} finally {
		if (conn) await conn.release();
	}
}

exports.deleteProfessor = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (!id) {
			throw { mensagem: "O ID é obrigatório", status: 400 };
		}
		if (isNaN(id)) {
			throw { mensagem: "O ID precisa ser um número", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se o professor existe
		const idProfessorExiste = await conn.query("SELECT id_professor FROM professor WHERE id_professor = ?", [id]);
		if (idProfessorExiste.length === 0) {
			throw { mensagem: "Professor não encontrado", status: 404 };
		}

		// Deletar professor
		await conn.query("DELETE FROM professor WHERE id_professor = ?", [id]);
		await conn.commit();

		return res.status(200).json({ mensagem: "Professor deletado com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();
		
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem });
	} finally {
		if (conn) await conn.release();
	}
}

module.exports = { ...exports };
