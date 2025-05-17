const pool = require('../database/db');

exports.getSalas = async (req, res) => {
	let conn;

	try {
		conn = await pool.getConnection();

		const salas = await conn.query("SELECT * FROM sala");

		return res.status(200).json(salas);
	} catch (erro) {
		return res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.postSala = async (req, res) => {
  let conn;

	try {
		const { nome, bloco, espaco, numero_sala: numeroSala } = req.body;

    if(!nome || !bloco || !espaco || !numeroSala){
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }

    if(typeof(nome) !== "string" || isNaN(bloco) || isNaN(espaco) || isNaN(numeroSala)){
      throw { mensagem: "Dados inválidos", status: 400 };
    }
    
    conn = await pool.getConnection();
    conn.beginTransaction();

	  const salaExiste = await conn.query("SELECT 1 FROM sala WHERE bloco = ? AND espaco = ? AND numero_sala = ?", [bloco, espaco, numeroSala]);
    if(salaExiste.length > 0){
      throw { mensagem: "Sala já existe", status: 409 };
    }

    await conn.query("INSERT INTO sala (nome, bloco, espaco, numero_sala) VALUES (?, ?, ? ,?)", [nome, bloco, espaco, numeroSala]);
    await conn.commit();

		return res.status(201).json({ mensagem:"Sala criada com sucesso" });
	} catch (erro) {
    if (conn) conn.rollback();

    const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.getSalasById = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;
    
    if(isNaN(id)){
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = pool.getConnection();
    const salas = await conn.query("SELECT * FROM sala WHERE id_sala = ?", [id]);

    return res.status(200).json(salas);
  }catch(erro){
    const statusCode = erro.status || 500;
    return res.status(200).json({ error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

exports.putSala = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;
    const { nome, bloco, espaco, numero_sala: numeroSala } = req.body;

    if(!id || !nome || !bloco || !espaco || !numeroSala){
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }

    if(isNaN(id) || typeof(nome) !== "string" || isNaN(bloco) || isNaN(espaco) || isNaN(numeroSala)){
      throw { mensagem: "Dados inválidos", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const salaExiste = await conn.query("SELECT 1 FROM sala WHERE id_sala = ?", [id]);
    if(salaExiste.length === 0){
      throw { mensagem: "Sala não encontrada", status: 404 };
    }

    await conn.query("UPDATE sala SET nome = ?, bloco = ?, espaco = ?, numero_sala = ? WHERE id_sala = ?", [nome, bloco, espaco, numeroSala, id]);
    await conn.commit();

    return res.status(200).json({ mensagem: "Sala atualizada com sucesso" });
  }catch(erro){
    const statusCode = erro.status || 500;
    return res.status(200).json({ error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

exports.deleteSala = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;
    
    if(isNaN(id)){
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = pool.getConnection();

    const salaExiste = await conn.query("SELECT 1 FROM sala WHERE id_sala = ?", [id]);
    if(salaExiste.length === 0){
      throw { message: "Sala informada não existe", status: 404 };
    }

    await conn.query("DELETE FROM sala WHERE id_sala = ?", [id]);
    await conn.commit();

    return res.status(200).json( {mensagem: "Sala deletada com sucesso"} );
  }catch(erro){
    if (conn) await conn.rollback();

    const statusCode = erro.status || 500;
    return res.status(200).json({ error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

exports.getAulasBySalaId = async (req, res) => {
  let conn;

	try {
		const { id } = req.params;
    
    if(isNaN(id)){
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
		const aulas = await conn.query("SELECT * FROM aula WHERE id_sala = ?", [id]);

		return res.status(200).json(aulas);
	} catch (erro) {
    const statusCode = erro.status || 500;
		return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

module.exports = { ...exports };
