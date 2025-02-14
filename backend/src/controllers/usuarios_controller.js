require('dotenv').config();
const pool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.get_usuarios = async (req, res) => {
	let conn;
	try {
		conn = await pool.getConnection();
		await conn.beginTransaction();

		const usuarios = await conn.query("SELECT * FROM usuario");
		await conn.commit();

		res.status(200).json({ usuarios });
	} catch (err) {
		if (conn) await conn.rollback();
		res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.post_usuario = async (req, res) => {
	let conn;
	try {
		const { email, senha, tipo } = req.body;
		const salt_rounds = 10;

		if (!email || !senha || !tipo) {
			throw { message: "Todos os campos são obrigatórios", status: 400 };
		}
		if (typeof (email) !== "string" || typeof (senha) !== "string" || typeof (tipo) !== "string") {
			throw { message: "Dados inválidos", status: 400 };
		}
		if (!(tipo === "Professor" || tipo === "Aluno")) {
			throw { message: "Tipo de usuário inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		// Verificar se o email já foi utilizado
		const existent_email = await conn.query("SELECT email FROM usuario WHERE email = ?", [email]);
		if (existent_email.length > 0) {
			throw { message: "Email já foi cadastrado", status: 409 };
		}

		// Gerar hash da senha
		const hash_senha = await bcrypt.hash(senha, salt_rounds);

		await conn.query("INSERT INTO usuario (email, hash_senha, tipo) VALUES (?, ?, ?)", [email, hash_senha, tipo]);
		await conn.commit();

		return res.status(201).json({ message: "Usuário registrado com sucesso" });
	} catch (err) {
		if (conn) conn.rollback();
		const status_code = err.status || 500;

		return res.status(status_code).json({ error: err.message });
	} finally {
		if (conn) conn.release();
	}
}

exports.get_usuario_by_id = async (req, res) => {
	let conn;
	try {
		const { id } = req.params;

		if (isNaN(id)) {
			throw { message: "ID inválido", status: 400 };
		}

		conn = await pool.getConnection();
		await conn.beginTransaction();

		const usuario = await conn.query("SELECT * FROM usuario WHERE id_usuario = ?", [id]);
		await conn.commit();

		res.status(200).json({ usuario });
	} catch (err) {
		const status_code = err.status || 500;
		if (conn) conn.rollback();

		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.post_login_user = async (req, res) => {
	let conn;
	try {
		const { email, senha } = req.body;

		if (!email || !senha) {
			throw { message: "Todos os campos são obrigatórios", status: 400 };
		}

		conn = await pool.getConnection();

		const rows = await conn.query("SELECT * FROM usuario WHERE email = ?", [email]);
		if (!rows) {
			throw { message: "Usuário ou senha inválidos", status: 401 };
		}
		const usuario = rows[0];

		const correct_creds = await bcrypt.compare(senha, usuario.hash_senha);
		if (!correct_creds) {
			throw { message: "Usuário ou senha inválidos", status: 401 };
		}

		const token = jwt.sign(
			{ id: usuario.id_usuario, email: usuario.email, tipo: usuario.tipo },
			process.env.SECRET_KEY,
			{ expiresIn: "1h" }
		);

		return res.status(200).json({ message: "Usuário validado com sucesso", token });
	} catch (err) {
		const status_code = err.status || 500;
		return res.status(status_code).json({ error: err.message || "Erro interno no servidor" });
	} finally {
		if (conn) conn.release();
	}
}

exports.get_me_user = async (req, res) => {
	const token = req.headers.authorization?.split(" ")[1];

	try {
		if (!token) {
			throw { message: "Token não fornecido", status: 401 };
		}

		const usuario = jwt.verify(token, process.env.SECRET_KEY);
		return res.status(200).json({ message: "Usuário validado", usuario: usuario });
	} catch (err) {
		const status_code = err.message || 401;
		return res.status(status_code).json({ error: err.message || "Token inválido ou expirado." });
	}
}

module.exports = { ...exports };
