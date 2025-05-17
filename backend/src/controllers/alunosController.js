const pool = require('../database/db');

exports.getAlunos = async (req, res) => {
	let conn;

	try {
		const { ano_letivo: anoLetivo } = req.query;

		if (anoLetivo && isNaN(anoLetivo)) {
			throw { mensagem: "O ano letivo deve ser um número válido", status: 400 };
		}

		conn = await pool.getConnection();

		let query = "SELECT * FROM aluno";
		let valor = [];

		if (anoLetivo) {
			query += " WHERE ano_letivo = ?";
			valor.push(anoLetivo);
		}

		const alunos = await conn.query(query, valor);

		return res.status(200).json(alunos);
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.postAlunos = async (req, res) => {
	let conn;
	
	try {
		const { id_usuario: idUsuario, id_curso: idCurso, nome, ra, rfid_tag: rfidTag, ano_letivo: anoLetivo } = req.body;

		if (!idUsuario || !idCurso || !nome || !ra || !rfidTag || !anoLetivo) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}

		if (isNaN(idUsuario) || isNaN(idCurso) || typeof nome !== "string" || isNaN(ra) || typeof (rfidTag) !== "string" || isNaN(anoLetivo)) {
			throw { mensagem: "Dados inválidos", status: 400 };
		}

		if (anoLetivo < 1 || anoLetivo > 4) {
			throw { mensagem: "Ano letivo inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se o usuário existe
		const usuario = await conn.query("SELECT id_usuario from usuario WHERE id_usuario = ?", [idUsuario]);
		if (usuario.length === 0) {
			throw { mensagem: "O usuário não existe", status: 404 };
		}

		// Verificar se o usuário já foi cadastrado
		const usuarioAlunoCadastrado = await conn.query("SELECT id_usuario FROM aluno WHERE id_usuario = ?", [idUsuario]);
		if (usuarioAlunoCadastrado.length > 0) {
			throw { mensagem: "O usuário já foi registrado como aluno", status: 409 };
		}
		const usuarioProfessorCadastrado = await conn.query("SELECT id_usuario FROM professor WHERE id_usuario = ?", [idUsuario]);
		if (usuarioProfessorCadastrado.length > 0) {
			throw { mensagem: "O usuário já foi registrado como professor", status: 409 };
		}

		// Veriificar se o curso existe
		const cursoExiste = await conn.query("SELECT id_curso FROM curso WHERE id_curso = ?", [idCurso]);
		if (cursoExiste.length === 0) {
			throw { mensagem: "O curso informado não existe ", status: 404 };
		}

		// Verificar se o RA já foi utilizado
		const raExiste = await conn.query("SELECT id_aluno FROM aluno WHERE ra = ?", [ra]);
		if (raExiste.length > 0) {
			throw { mensagem: "O RA informado já está registrado no sistema", status: 409 };
		}

		// Verificar se RFID_TAG já foi utilizada
		const rfidTagExiste = await conn.query("SELECT id_aluno FROM aluno WHERE rfid_tag = ?", [rfidTag]);
		if (rfidTagExiste.length > 0) {
			throw { mensagem: "A tag RFID informada já está registrada no sistema", status: 409 };
		}

		// Registrar aluno
		await conn.query(
			"INSERT INTO aluno (id_usuario, id_curso, nome, ra, rfid_tag, ano_letivo) VALUES (?, ?, ?, ?, ?, ?)",
			[idUsuario, idCurso, nome, ra, rfidTag, anoLetivo]
		);

		await conn.commit();
		return res.status(201).json({ mensagem: "Aluno cadastrado com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getAlunosById = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;
		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			throw { mensagem: "Aluno não encontrado", status: 404 };
		}

		return res.status(200).json(aluno[0]);
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.putAlunos = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;
		const { nome, ra, id_curso: idCurso, ano_letivo: anoLetivo, rfid_tag: rfidTag } = req.body;

		if (!nome || !ra || !idCurso || !anoLetivo || !rfidTag) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}

		if (isNaN(id) || typeof (nome) !== "string" || isNaN(ra) || isNaN(idCurso) || isNaN(anoLetivo) || typeof (rfidTag) !== "string") {
			throw { mensagem: "Dados inválidos", status: 400 };
		}

		if (anoLetivo < 0 || anoLetivo > 4) {
			throw { mensagem: "Ano letivo inválido", status: 400 };
		}

		conn = await pool.getConnection();

		// Verificar se o aluno existe
		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);
		if (aluno.length === 0) {
			throw { mensagem: "Aluno não encontrado", status: 404 };
		}

		const alunoAtual = aluno[0];

		// Verificar se o curso é válido
		const cursoExiste = await conn.query("SELECT id_curso FROM curso WHERE id_curso = ?", [idCurso]);
		if (cursoExiste.length === 0) {
			throw { mensagem: "O curso informado é inválido", status: 400 };
		}

		// Verificar se o RA já foi utilizado
		if (ra != alunoAtual.ra) {
			const raExiste = await conn.query("SELECT id_aluno FROM aluno WHERE ra = ?", [ra]);
			if (raExiste.length > 0) {
				throw { mensagem: "O RA informado já está registrado no sistema", status: 409 };
			}
		}

		// Verificar se RFID_TAG já foi utilizada
		if (rfidTag != alunoAtual.rfid_tag) {
			const rfidTagExiste = await conn.query("SELECT id_aluno FROM aluno WHERE rfid_tag = ?", [rfidTag]);
			if (rfidTagExiste.length > 0) {
				throw { mensagem: "A tag RFID informada já está registrada no sistema", status: 409 };
			}
		}

		// Realizar update das informações
		await conn.query(
			"UPDATE aluno SET nome = ?, ra = ?, id_curso = ?, ano_letivo = ?, rfid_tag = ? WHERE id_aluno = ?",
			[nome, ra, idCurso, anoLetivo, rfidTag, id]
		);

		return res.status(200).json({ mensagem: "Aluno atualizado com sucesso" });
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.deleteAlunos = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID do aluno deve ser um número válido", status: 400 };
		}

		conn = await pool.getConnection();

		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			throw { mensagem: "Aluno não encontrado", status: 404 };
		}

		await conn.query("DELETE FROM aluno WHERE id_aluno = ?", [id]);

		return res.status(200).json({ mensagem: "Aluno deletado com sucesso" });
	} catch (err) {
		const statusCode = err.status || 500;
		return res.status(statusCode).json({ error: err.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getPresencasByAlunoId = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;
		const { id_disciplina: idDisciplina } = req.query;

		if (isNaN(id)) {
			throw { mensagem: "ID do aluno deve ser um número válido", status: 400 };
		}

		if (idDisciplina && isNaN(idDisciplina)) {
			throw { mensagem: "ID da disciplina deve ser um número válido", status: 400 };
		}

		conn = await pool.getConnection();

		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			throw { mensagem: "Aluno não encontrado", status: 404 };
		}

		let presencas;

		if (idDisciplina) {
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
				[id, idDisciplina]
			);
		} else {
			presencas = await conn.query(`SELECT * FROM presenca WHERE id_aluno = ?`, [id]);
		}

		return res.status(200).json({ aluno_id: id, presencas });
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getDisciplinaByAlunoId = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID do aluno deve ser um número válido", status: 400 };
		}

		conn = await pool.getConnection();

		const aluno = await conn.query(`SELECT * FROM aluno WHERE id_aluno = ?`, [id]);

		if (aluno.length === 0) {
			throw { mensagem: "Aluno não encontrado", status: 404 };
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

		return res.status(200).json({ aluno_id: id, disciplinas });
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getCursoByAlunoId = async (req, res) => {
	let conn;
	try {
		let { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID do aluno deve ser um número válido", status: 400 };
		}

		conn = await pool.getConnection();

		const aluno = await conn.query("SELECT * FROM aluno WHERE id_aluno = ?", [id]);

		if (aluno.length === 0) {
			throw { mensagem: "Aluno não encontrado", status:404 };
		}

		const curso = await conn.query(
			"SELECT curso.* \
			FROM curso \
			JOIN aluno \
			ON curso.id_curso = aluno.id_curso \
			WHERE aluno.id_aluno = ?",
			[id]
		);

		return res.status(200).json({ aluno_id: id, curso });
	} catch (err) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

module.exports = { ...exports };
