const pool = require("../database/db");

exports.getPresencaById = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		const presenca = await conn.query("SELECT * FROM presenca WHERE id_presenca = ?", [id]);

		if (presenca.length === 0) {
			throw { mensagem: "Presença não encontrada", status: 404 };
		}

		return res.status(200).json({ presenca });
	} catch (erro) {
		const statusCode = erro.status || 500;
		if (conn) await conn.rollback();

		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getPresencasByAulaId = async (req, res) => {
	let conn;

	try {
		const { id_aula: idAula } = req.query;

		if (isNaN(idAula)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();

		const presencas = await conn.query(
			"SELECT aluno.id_aluno, aluno.nome, presenca.horario, IF(presenca.presente IS NOT NULL, TRUE, FALSE) as presente \
			FROM aluno JOIN disciplina_aluno ON aluno.id_aluno = disciplina_aluno.id_aluno \
			JOIN aula ON disciplina_aluno.id_disciplina = aula.id_disciplina \
			LEFT JOIN presenca ON aluno.id_aluno = presenca.id_aluno AND presenca.id_aula = aula.id_aula \
			WHERE aula.id_aula = ?",
			[idAula]
		);

		return res.status(200).json({ presencas });
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.putPresenca = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;
		const { id_aluno: idAluno, id_aula: idAula, presente } = req.body;

		if (!id || !idAluno || !idAula || !presente) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}

		if (isNaN(id) || isNaN(idAluno) || isNaN(idAula) || isNaN(presente) || presente !== 0 || presente !== 1) {
			throw { mensagem: "Dados inválidos", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se a presença existe
		const idPresencaExiste = await conn.query("SELECT id_presenca FROM presenca WHERE id_presenca = ?", [id]);
		if (idPresencaExiste.length === 0) {
			throw { mensagem: "A presença informada não existe", status: 404 };
		}

		// Verificar se id_aluno existe
		const idAlunoExiste = await conn.query("SELECT id_aluno FROM aluno WHERE id_aluno = ?", [idAluno]);
		if (idAlunoExiste.length === 0) {
			throw { mensagem: "O aluno informado não existe", status: 404 };
		}

		// Verificar se id_aula existe
		const idAulaExiste = await conn.query("SELECT id_aula FROM aula WHERE id_aula = ?", [idAula]);
		if (idAulaExiste.length === 0) {
			throw { mensagem: "A aula informada não existe", status: 404 };
		}

		await conn.query("INSERT INTO presenca (id_aluno, id_aula, presenca) VALUES (?, ?, ?)", [idAluno, idAula, presente]);

		await conn.commit();
		return res.status(201).json({ mensagem: "Presença atualizada com sucesso" });
	} catch (erro) {
		const statusCode = erro.status || 500;
		if (conn) await conn.rollback();

		return res.status(statusCode).json({ error: erro.mensagem });
	} finally {
		if (conn) await conn.release();
	}
}

exports.deletePresenca = async (req, res) => {
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

		// Verificar se a presença existe
		const idPresencaExiste = await conn.query("SELECT id_presenca FROM presenca WHERE id_presenca = ?", [id]);
		if (idPresencaExiste.length === 0) {
			throw { mensagem: "A presença informada não existe", status: 404 };
		}

		await conn.query("DELETE FROM presenca WHERE id_presenca = ?", [id]);

		await conn.commit();
		return res.status(200).json({ mensagem: "Presença deletada com sucesso" });
	} catch (erro) {
		const statusCode = erro.status || 500;
		if (conn) await conn.rollback();

		return res.status(statusCode).json({ error: erro.mensagem });
	} finally {
		if (conn) await conn.release();
	}
}

exports.postPresenca = async (req, res) => {
	let conn;

	try {
		const { rfid_tag: rfidTag, id_sala: idSala } = req.body;

		// Verifica se os valores informados são válidos
		if (!rfidTag || !idSala) {
			throw { mensagem: "Todos os valores são obrigatórios", status: 400 };
		}
		if (typeof (rfidTag) !== "string" || isNaN(idSala)) {
			throw { mensagem: "Os dados são inválidos", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verifica se a tag informada está associada a algum aluno
		const aluno = await conn.query("SELECT id_aluno FROM aluno WHERE rfid_tag = ?", [rfidTag]);
		if (aluno.length === 0) {
			throw { mensagem: "RFID não encontrado", status: 404 };
		}
		const { id_aluno: idAluno } = aluno[0];

		// Verifica se há alguma aula ocorrendo na sala informada no horário e dia atuais
		const aula = await conn.query("SELECT id_aula, id_disciplina FROM aula WHERE id_sala = ? AND NOW() BETWEEN inicio and fim LIMIT 1", [idSala]);
		if (aula.length === 0) {
			throw { mensagem: "Nenhuma aula está ocorrendo nesta sala", status: 404 };
		}
		const { id_aula: idAula, id_disciplina: idDisciplina } = aula[0];

		// Verifica se o aluno pertence à disciplina
		const disciplinaAluno = await conn.query("SELECT id_disciplina_aluno FROM disciplina_aluno WHERE id_aluno = ? AND id_disciplina = ?", [idAluno, idDisciplina]);
		if (disciplinaAluno.length === 0) {
			throw { mensagem: "O aluno não pertence a disciplina", status: 403 };
		}

		// Verifica se a presença já foi registrada
		const presenca = await conn.query("SELECT id_presenca FROM presenca WHERE id_aluno = ? AND id_aula = ?", [idAluno, idAula]);
		if (presenca.length > 0) {
			throw { mensagem: "A presença já foi registrada", status: 409 };
		}

		await conn.query("INSERT into presenca (id_aluno, id_aula, presente, horario) VALUES (?, ?, true, NOW())", [idAluno, idAula]);
		await conn.commit();

		return res.status(201).json({ mensagem: "Presença registrada com sucesso" });
	} catch (err) {
		await conn.rollback();
		const statusCode = err.status || 500;

		return res.status(statusCode).json({ error: err.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release;
	}
}

module.exports = { ...exports };
