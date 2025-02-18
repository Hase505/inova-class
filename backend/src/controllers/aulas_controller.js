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

exports.post_aulas = async (req, res) => {
	let conn;
	try {
		const { id_disciplina, id_sala, data, horario_inicio, horario_fim, nome_aula } = req.body;

		if (!id_disciplina || !id_sala || !data || !horario_inicio || !horario_fim || !nome_aula) {
			throw { message: "Todos os campos são obrigatórios", status: 400 };
		}

		if (isNaN(id_disciplina) || isNaN(id_sala) || typeof (nome_aula) !== "string") {
			throw { message: "Dados inválidos", status: 400 };
		}

		// Validação da data
		const data_regex = /^\d{4}-\d{2}-\d{2}$/;
		if (!data_regex.test(data)) {
			throw { message: "Data inválida", status: 400 };
		}

		const [ano, mes, dia] = data.split('-').map(Number);
		const data_validada = new Date(ano, mes - 1, dia);

		if (!(data_validada.getFullYear() === ano && data_validada.getMonth() === mes - 1 && data_validada.getDate() === dia)) {
			throw { message: "Data inválida", status: 400 };
		}

		// Validação do horário de início e fim
		const horario_regex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
		if (!(horario_regex.test(horario_inicio) && horario_regex.test(horario_fim))) {
			throw { message: "Horários inválidos", status: 400 };
		}

		// Verificar se as data e horários estão no futuro
		const data_horario_inicio_string = `${data}T${horario_inicio}`;
		const data_horario_inicio_validados = new Date(data_horario_inicio_string);
		const data_horario_atuais = new Date();

		if (data_horario_inicio_validados.getTime() < data_horario_atuais.getTime()) {
			throw { message: "Data ou horários já ocorreram", status: 400 };
		}

		const data_horario_fim_string = `${data}T${horario_fim}`;
		const data_horario_fim_validados = new Date(data_horario_fim_string);

		if (data_horario_fim_validados.getTime() < data_horario_atuais.getTime()) {
			throw { message: "Data ou horários já ocorreram", status: 400 };
		}

		// Verificar se o horario de início é menor que o horário de fim
		if (data_horario_inicio_validados.getTime() > data_horario_fim_validados.getTime()) {
			throw { message: "Horário de início deve ser menor que horário de fim", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se disciplina existe
		const disciplina = await conn.query("SELECT id_disciplina FROM disciplina WHERE id_disciplina = ?", [id_disciplina]);
		if (disciplina.length === 0) {
			throw { message: "Disciplina não encontrada", status: 404 };
		}

		// Verificar se sala existe
		const sala = await conn.query("SELECT id_sala FROM sala WHERE id_sala = ?", [id_sala]);
		if (sala.length === 0) {
			throw { message: "Sala não encontrada", status: 404 };
		}

		// Verificar se há alguma aula agendada para o horário e sala requisitados
		const horario_sala = await conn.query(
			"SELECT id_aula \
			FROM aula WHERE id_sala = ? \
			AND (? < fim) AND (? > inicio)",
			[id_sala, data + " " + horario_inicio, data + " " + horario_fim]
		);
		if (horario_sala.length > 0) {
			throw { message: "Já existe uma aula registrada nesta sala neste horário", status: 409 };
		}

		await conn.query(
			"INSERT INTO aula (id_disciplina, id_sala, inicio, fim, nome_aula) \
			VALUES (?, ?, ?, ?, ?)",
			[id_disciplina, id_sala, data + " " + horario_inicio, data + " " + horario_fim, nome_aula]
		);

		await conn.commit();

		return res.status(201).json({ message: "Aula registrada com sucesso" });
	} catch (err) {
		if (conn) conn.rollback();

		const status_code = err.status || 500;
		return res.status(status_code).json({ error: err.message || "Erro interno no servidor " });
	} finally {
		if (conn) conn.release();
	}
}

module.exports = { ...exports } 
