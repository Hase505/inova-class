const express = require('express');
const app = express();
const port = 3000;
const pool = require('./db');

app.get('/alunos', async (req, res) => {
	let conn;
	try {
		conn = await pool.getConnection();
		const rows = await conn.query("SELECT * FROM aluno");
		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	} finally {
		if (conn) conn.release();
	}
});

app.get('/professores', async (req, res) => {
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
});

app.listen(port, () => {
	console.log('Servidor sendo executado na porta: ${port}');
})
