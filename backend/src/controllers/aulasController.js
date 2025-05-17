const pool = require('../database/db');

exports.getAulasById = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();

		const [aulas] = await conn.query("SELECT * FROM aula WHERE id_aula = ?", [id]);

		return res.status(200).json(aulas);
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getAulasByDisciplina = async (req, res) => {
	let conn;
	try {
		const { id_disciplina: idDisciplina } = req.query;

		if (isNaN(idDisciplina)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();

		const aulas = await conn.query(
			"SELECT id_aula, nome_aula, aula.id_sala, bloco, espaco, numero_sala, inicio, fim \
			FROM aula \
			INNER JOIN sala ON aula.id_sala = sala.id_sala \
			WHERE aula.id_disciplina = ?",
			[idDisciplina]
		);

		return res.status(200).json({ aulas });

	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.postAulas = async (req, res) => {
	let conn;
	try {
		const { 
			id_disciplina: idDisciplina, 
			bloco, 
			espaco, 
			sala, 
			data, 
			horario_inicio: horarioInicio, 
			horario_fim: horarioFim, 
			nome_aula: nomeAula 
		} = req.body;

		if (!idDisciplina || !bloco || !espaco || !sala || !data || !horarioInicio || !horarioFim || !nomeAula) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}

		if (isNaN(idDisciplina) || isNaN(bloco) || isNaN(espaco) || isNaN(sala) || typeof (nomeAula) !== "string") {
			throw { mensagem: "Dados inválidos", status: 400 };
		}

		// Validação da data
		const data_regex = /^\d{4}-\d{2}-\d{2}$/;
		if (!data_regex.test(data)) {
			throw { mensagem: "Data inválida", status: 400 };
		}

		const [ano, mes, dia] = data.split('-').map(Number);
		const dataValidada = new Date(ano, mes - 1, dia);

		if (!(dataValidada.getFullYear() === ano && dataValidada.getMonth() === mes - 1 && dataValidada.getDate() === dia)) {
			throw { mensagem: "Data inválida", status: 400 };
		}

		// Validação do horário de início e fim
		const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
		if (!(horarioRegex.test(horarioInicio) && horarioRegex.test(horarioFim))) {
			throw { mensagem: "Horários inválidos", status: 400 };
		}

		// Verificar se as data e horários estão no futuro
		const dataHorarioInicioString = `${data}T${horarioInicio}`;
		const dataHorarioInicioValidados = new Date(dataHorarioInicioString);
		const dataHorarioAtuais = new Date();

		if (dataHorarioInicioValidados.getTime() < dataHorarioAtuais.getTime()) {
			throw { mensagem: "Data ou horários já ocorreram", status: 400 };
		}

		const dataHorarioFimString = `${data}T${horarioFim}`;
		const dataHorarioFimValidados = new Date(dataHorarioFimString);

		if (dataHorarioFimValidados.getTime() < dataHorarioAtuais.getTime()) {
			throw { mensagem: "Data ou horários já ocorreram", status: 400 };
		}

		// Verificar se o horario de início é menor que o horário de fim
		if (dataHorarioInicioValidados.getTime() > dataHorarioFimValidados.getTime()) {
			throw { mensagem: "Horário de início deve ser menor que horário de fim", status: 400 };
		}

		// Verificar se os horários são iguais
		if (dataHorarioInicioValidados.getTime() === dataHorarioFimValidados.getTime()) {
			throw { mensagem: "Horário de início deve ser diferente do horário de fim", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Obter id da sala a partir de bloco, espaço e sala
		const [{ id_sala: idSala }] = await conn.query(
			"SELECT id_sala FROM sala WHERE bloco = ? \
			AND espaco = ? AND numero_sala = ?",
			[bloco, espaco, sala]
		);

		// Verificar se disciplina existe
		const disciplinaExiste = await conn.query("SELECT id_disciplina FROM disciplina WHERE id_disciplina = ?", [idDisciplina]);
		if (disciplinaExiste.length === 0) {
			throw { mensagem: "Disciplina não encontrada", status: 404 };
		}

		// Verificar se sala existe
		const salaExiste = await conn.query("SELECT id_sala FROM sala WHERE id_sala = ?", [idSala]);
		if (salaExiste.length === 0) {
			throw { mensagem: "Sala não encontrada", status: 404 };
		}

		// Verificar se há alguma aula agendada para o horário e sala requisitados
		const horarioSala = await conn.query(
			"SELECT id_aula \
			FROM aula WHERE id_sala = ? \
			AND (? < fim) AND (? > inicio)",
			[idSala, data + " " + horarioInicio, data + " " + horarioFim]
		);
		if (horarioSala.length > 0) {
			throw { mensagem: "Já existe uma aula registrada nesta sala neste horário", status: 409 };
		}

		await conn.query(
			"INSERT INTO aula (id_disciplina, id_sala, inicio, fim, nome_aula) \
			VALUES (?, ?, ?, ?, ?)",
			[idDisciplina, idSala, data + " " + horarioInicio, data + " " + horarioFim, nomeAula]
		);

		await conn.commit();

		return res.status(201).json({ mensagem: "Aula registrada com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.putAulas = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;
		const { 
			id_disciplina: idDisciplina, 
			bloco, 
			espaco, 
			sala, 
			data, 
			horario_inicio: horarioInicio, 
			horario_fim: horarioFim, 
			nome_aula: nomeAula 
		} = req.body;

		if (!id || !idDisciplina || !bloco || !espaco || !sala || !data || !horarioInicio || !horarioFim || !nomeAula) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}

		if (isNaN(id) || isNaN(idDisciplina) || isNaN(bloco) || isNaN(espaco) || isNaN(sala) || typeof (nomeAula) !== "string") {
			throw { mensagem: "Dados inválidos", status: 400 };
		}

		// Validação da data
		const data_regex = /^\d{4}-\d{2}-\d{2}$/;
		if (!data_regex.test(data)) {
			throw { mensagem: "Data inválida", status: 400 };
		}

		const [ano, mes, dia] = data.split('-').map(Number);
		const dataValidada = new Date(ano, mes - 1, dia);

		if (!(dataValidada.getFullYear() === ano && dataValidada.getMonth() === mes - 1 && dataValidada.getDate() === dia)) {
			throw { mensagem: "Data inválida", status: 400 };
		}

		// Validação do horário de início e fim
		const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
		if (!(horarioRegex.test(horarioInicio) && horarioRegex.test(horarioFim))) {
			throw { mensagem: "Horários inválidos", status: 400 };
		}

		// Verificar se as data e horários estão no futuro
		const dataHorarioInicioString = `${data}T${horarioInicio}`;
		const dataHorarioInicioValidados = new Date(dataHorarioInicioString);
		const dataHorarioAtuais = new Date();

		if (dataHorarioInicioValidados.getTime() < dataHorarioAtuais.getTime()) {
			throw { mensagem: "Data ou horários já ocorreram", status: 400 };
		}

		const dataHorarioFimString = `${data}T${horarioFim}`;
		const dataHorarioFimValidados = new Date(dataHorarioFimString);

		if (dataHorarioFimValidados.getTime() < dataHorarioAtuais.getTime()) {
			throw { mensagem: "Data ou horários já ocorreram", status: 400 };
		}

		// Verificar se o horario de início é menor que o horário de fim
		if (dataHorarioInicioValidados.getTime() > dataHorarioFimValidados.getTime()) {
			throw { mensagem: "Horário de início deve ser menor que horário de fim", status: 400 };
		}

		// Verificar se os horários são iguais
		if (dataHorarioInicioValidados.getTime() === dataHorarioFimValidados.getTime()) {
			throw { mensagem: "Horário de início deve ser diferente do horário de fim", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Obter id da sala a partir de bloco, espaço e sala
		const [{ id_sala: idSala }] = await conn.query(
			"SELECT id_sala FROM sala WHERE bloco = ? \
			AND espaco = ? AND numero_sala = ?",
			[bloco, espaco, sala]
		);

		// Verificar se aula existe
		const aulaExiste = await conn.query("SELECT id_aula FROM aula WHERE id_aula = ?", [id]);
		if (aulaExiste.length === 0) {
			throw { mensagem: "Aula não encontrada", status: 404 };
		}

		// Verificar se disciplina existe
		const disciplinaExiste = await conn.query("SELECT id_disciplina FROM disciplina WHERE id_disciplina = ?", [idDisciplina]);
		if (disciplinaExiste.length === 0) {
			throw { mensagem: "Disciplina não encontrada", status: 404 };
		}

		// Verificar se sala existe
		const salaExiste = await conn.query("SELECT id_sala FROM sala WHERE id_sala = ?", [idSala]);
		if (salaExiste.length === 0) {
			throw { mensagem: "Sala não encontrada", status: 404 };
		}

		// Verificar se há alguma aula agendada para o horário e sala requisitados
		const horarioSala = await conn.query(
			"SELECT id_aula \
			FROM aula WHERE id_sala = ? \
			AND (? < fim) AND (? > inicio) AND id_aula != ?",
			[idSala, data + " " + horarioInicio, data + " " + horarioFim, id]
		);
		if (horarioSala.length > 0) {
			throw { mensagem: "Já existe uma aula registrada nesta sala neste horário", status: 409 };
		}

		await conn.query(
			"UPDATE aula SET id_disciplina = ?, id_sala = ?, inicio = ?, fim = ?, nome_aula = ? \
			WHERE id_aula = ?",
			[idDisciplina, idSala, data + " " + horarioInicio, data + " " + horarioFim, nomeAula, id]
		);
		await conn.commit();

		return res.status(200).json({ mensagem: "Aula atualizada com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.deleteAulas = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		const aulaExiste = await conn.query("SELECT id_aula FROM aula WHERE id_aula = ?", [id]);
		if (aulaExiste.length === 0) {
			throw { mensagem: "Aula não encontrada", status: 404 };
		}

		await conn.query("DELETE FROM aula WHERE id_aula = ?", [id]);
		await conn.commit();

		return res.status(200).json({ mensagem: "Aula deletada com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

module.exports = { ...exports } 
