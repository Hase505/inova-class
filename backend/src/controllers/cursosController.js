const pool = require('../database/db');

exports.getCursos = async (req, res) => {
	let conn;

	try {
		conn = await pool.getConnection();

		const cursos = await conn.query("SELECT * FROM curso");

		return res.status(200).json(cursos);
	} catch (erro) {
		return res.status(500).json({ error: "Erro interno no servidor" });
	} finally {
		if (conn) await conn.release();
	}
}

exports.postCursos = async (req, res) => {
  let conn;

  try{
    const { nome } = req.body;

    if(!nome){
      throw { mensagem: "Todos os dados são obrigatórios", status: 400 };
    }
    
    if(typeof(nome) !== "string"){
      throw { mensagem: "Nome inválido", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verificar se o curso já existe
    const curso = await conn.query("SELECT nome FROM curso WHERE nome = ?", [nome]);
    if(curso.length > 0){
      throw { mensagem: "Nome do curso informado já existe", status: 409 };
    }

    await conn.query("INSERT INTO curso (nome) VALUES (?)", [nome]);
    await conn.commit();

    return res.status(201).json({ mensagem: "Curso registrado com sucesso" });
  }catch(erro){
    if(conn) await conn.rollback();

    const statusCode = erro.status || 500;
    return res.status(statusCode).json({error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) await conn.release();
  }
}

exports.getCursoById = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;

    if(!id){
      throw { mensagem: "Todos os valores são obrigatórios", status: 400 };
    }

    if(isNaN(id)){
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    const curso = await conn.query("SELECT * FROM curso WHERE id_curso = ?", [id]);
    if(curso.length === 0){
      throw { mensagem: "Curso não encontrado", status: 404 };
    }

    return res.status(200).json(curso);
  }catch (erro){
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

exports.putCurso = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;
    const { nome } = req.body;

    if(!nome || !id){
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }
    if(typeof(nome) !== "string" || isNaN(id)){
      throw { mensagem: "Dados inválidos", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verificar se curso existe
    const cursoExiste = await conn.query("SELECT 1 FROM curso WHERE id_curso = ?", [id]);
    if(cursoExiste.length === 0){
      throw { mensagem: "Curso informado não existe", status: 404 };
    }

    await conn.query("UPDATE curso SET nome = ? WHERE id_curso = ?", [nome, id]);
    await conn.commit();
    
    return res.status(200).json({ mensagem: "Curso atualizado com sucesso" });
  }catch(erro){
    if(conn) await conn.rollback();

    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

exports.deleteCurso = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;

    if(!id){
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }
    if(isNaN(id)){
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verificar se curso existe
    const cursoExiste = await conn.query("SELECT 1 FROM curso WHERE id_curso = ?", [id]);
    if(cursoExiste.length === 0){
      throw { mensagem: "Curso informado não existe", status: 404 };
    }

    await conn.query("DELETE FROM curso WHERE id_curso = ?", [id]);
    await conn.commit();
    
    return res.status(200).json({ mensagem: "Curso deletado com sucesso" });
  }catch(erro){
    if(conn) await conn.rollback();

    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

exports.getDisciplinasByCursoId = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;

    if(!id){
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }
    if(isNaN(id)){
      throw { mensagem: "Dados inválidos", status: 400 };
    }

    conn = await pool.getConnection();

    // Verificar se curso existe
    const cursoExiste = await conn.query("SELECT 1 FROM curso WHERE id_curso = ?", [id]);
    if(cursoExiste.length === 0){
      throw { mensagem: "Curso informado não existe", status: 404 };
    }


    const disciplinas = await conn.query("SELECT * FROM disciplina WHERE id_curso = ?", [id]);
    
    return res.status(200).json(disciplinas);
  }catch(erro){
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

exports.getAlunosByCursoId = async (req, res) => {
  let conn;

  try{
    const { id } = req.params;

    if(!id){
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }
    if(isNaN(id)){
      throw { mensagem: "Dados inválidos", status: 400 };
    }

    conn = await pool.getConnection();

    // Verificar se o curso existe
    const cursoExiste = await conn.query("SELECT 1 FROM curso WHERE id_curso = ?", [id]);
    if(cursoExiste.length === 0){
      throw { mensagem: "Curso informado não existe", status: 404 };
    }

    const alunos = await conn.query("SELECT * FROM aluno WHERE id_curso = ?", [id]);
    
    return res.status(200).json(alunos);
  }catch(erro){
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  }finally{
    if (conn) conn.release();
  }
}

module.exports = { ...exports };
