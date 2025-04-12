require('dotenv').config();
const pool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.getUsuarios = async (req, res) => {
	let conn;

	try {
		conn = await pool.getConnection();

		const usuarios = await conn.query("SELECT * FROM usuario");

		return res.status(200).json(usuarios);
	} catch (erro) {
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.postUsuario = async (req, res) => {
	let conn;

	try {
		const { email, senha, tipo } = req.body;
		const salt_rounds = 10;

		if (!email || !senha || !tipo) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}
		if (typeof (email) !== "string" || typeof (senha) !== "string" || typeof (tipo) !== "string") {
			throw { mensagem: "Dados inválidos", status: 400 };
		}
		if (!(tipo === "Professor" || tipo === "Aluno")) {
			throw { mensagem: "Tipo de usuário inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se o email já foi utilizado
		const emailExiste = await conn.query("SELECT email FROM usuario WHERE email = ?", [email]);
		if (emailExiste.length > 0) {
			throw { mensagem: "Email já foi cadastrado", status: 409 };
		}

		// Gerar hash da senha
		const hashSenha = await bcrypt.hash(senha, salt_rounds);

		await conn.query("INSERT INTO usuario (email, hash_senha, tipo) VALUES (?, ?, ?)", [email, hashSenha, tipo]);
		await conn.commit();

		return res.status(201).json({ mensagem: "Usuário registrado com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getUsuarioById = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		const usuario = await conn.query("SELECT * FROM usuario WHERE id_usuario = ?", [id]);

		return res.status(200).json(usuario);
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.putUsuario = async (req, res) => {
	let conn;

	try{
		const { id } = req.params;
		const { email, senha, tipo } = req.body;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}
		if (!email || !senha || !tipo) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}
		if (typeof (email) !== "string" || typeof (senha) !== "string" || typeof (tipo) !== "string") {
			throw { mensagem: "Dados inválidos", status: 400 };
		}
		if (!(tipo === "Professor" || tipo === "Aluno")) {
			throw { mensagem: "Tipo de usuário inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		const hashSenha = await bcrypt.hash(senha, 10);

		await conn.query("UPDATE usuario SET email = ?, hash_senha = ?, tipo = ? WHERE id_usuario = ?", [email, hashSenha, tipo, id]);
		await conn.commit();

		return res.status(200).json({ mensagem: "Usuário atualizado com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem });
	} finally {
		if (conn) await conn.release();
	}
}

exports.deleteUsuario = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		await conn.query("DELETE FROM usuario WHERE id_usuario = ?", [id]);
		await conn.commit();

		return res.status(200).json({ mensagem: "Usuário deletado com sucesso" });
	} catch (erro) {
		if (conn) await conn.rollback();

		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem });
	} finally {
		if (conn) await conn.release();
	}
}
	
exports.postLogin = async (req, res) => {
	let conn;

	try {
		const { email, senha } = req.body;

		if (!email || !senha) {
			throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
		}

		conn = await pool.getConnection();

		const usuarios = await conn.query("SELECT * FROM usuario WHERE email = ?", [email]);
		if (usuarios.length == 0) {
			throw { mensagem: "Usuário ou senha inválidos", status: 401 };
		}
		const usuario = usuarios[0];

		const credenciaisCorretas = await bcrypt.compare(senha, usuario.hash_senha);
		if (!credenciaisCorretas) {
			throw { mensagem: "Usuário ou senha inválidos", status: 401 };
		}

		const token = jwt.sign(
			{ id: usuario.id_usuario, email: usuario.email, tipo: usuario.tipo },
			process.env.SECRET_KEY,
			{ expiresIn: "1h" }
		);

		return res.status(200).json({ mensagem: "Usuário validado com sucesso", token });
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getValidateMe = async (req, res) => {
	const token = req.headers.authorization?.split(" ")[1];
	let conn;

	try {
		if (!token) {
			throw { mensagem: "Token não fornecido", status: 401 };
		}

		const usuario = jwt.verify(token, process.env.SECRET_KEY);
		const { tipo } = usuario;

		conn = await pool.getConnection();

		if (tipo == "Professor") {
			const [professor] = await conn.query("SELECT * FROM professor WHERE id_usuario = ?", [usuario.id]);
			return res.status(200).json({ mensagem: "Usuário validado", usuario: usuario, professor: professor || null });
		}
		if (tipo == "Aluno") {
			const [aluno] = await conn.query("SELECT * FROM aluno WHERE id_usuario = ?", [usuario.id]);
			return res.status(200).json({ mensagem: "Usuário validado", usuario: usuario, aluno: aluno || null });
		}

		return res.status(200).json({ mensagem: "Usuário validado", usuario: usuario });
	} catch (erro) {
		const statusCode = erro.status || 401;
		return res.status(statusCode).json({ error: erro.mensagem || "Token inválido ou expirado." });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getProfessorByUsuarioId = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		const professor = await conn.query("SELECT * FROM professor WHERE id_usuario = ?", [id]);

		return res.status(200).json(professor);
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getAlunoByUsuarioId = async (req, res) => {
	let conn;

	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { mensagem: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		const aluno = await conn.query("SELECT * FROM aluno WHERE id_usuario = ?", [id]);

		return res.status(200).json(aluno);
	} catch (erro) {
		const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}



module.exports = { ...exports };
