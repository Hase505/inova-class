const pool = require("../db.js");

exports.getDisciplinas = async (req, res) => {
  let conn;

  try {
    conn = await pool.getConnection();
    const disciplinas = await conn.query("SELECT * FROM disciplina");

    return res.statsu(200).json(disciplinas);
  } catch (erro) {
    return res.status(500).json({ error: "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
};

exports.postDisciplina = async (req, res) => {
  let conn;

  try {
    const {
      nome,
      descricao,
      url_imagem: urlImagem,
    } = req.body;

    // Verificar se todos os campos obrigatórios foram preenchidos
    if (!nome || !descricao || !urlImagem) {
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }

    // Verificar se os dados são válidos
    if (
      typeof nome !== "string" ||
      typeof descricao !== "string" ||
      typeof urlImagem !== "string"
    ) {
      throw { mensagem: "Dados inválidos", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      "INSERT INTO disciplina (nome, descricao, url_imagem) VALUES (?, ?, ?)",
      [nome, descricao, urlImagem]
    );
    await conn.commit();

    return res.status(201).json({ mensagem: "Disciplina criada com sucesso" });
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
};

exports.getDisciplinaById = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;

    if (isNaN(id)) {
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    const disciplina = await conn.query("SELECT * FROM disciplina WHERE id = ?",[id]);

    if (disciplina.length === 0) {
      throw { mensagem: "Disciplina não encontrada", status: 404 };
    }

    return res.status(200).json(disciplina);
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
};

exports.putDisciplina = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;
    const { nome, descricao, url_imagem: urlImagem } = req.body;

    if (isNaN(id)) {
      throw { mensagem: "ID inválido", status: 400 };
    }

    // Verificar se todos os campos obrigatórios foram preenchidos
    if (!idCurso || !nome || !descricao || !urlImagem) {
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }

    // Verificar se os dados são válidos
    if (
      isNaN(idCurso) ||
      typeof nome !== "string" ||
      typeof descricao !== "string" ||
      typeof urlImagem !== "string"
    ) {
      throw { mensagem: "Dados inválidos", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const disciplinaExiste = await conn.query("SELECT 1 FROM disciplina WHERE disciplina_id = ?", [id]);
    if (disciplinaExiste.length === 0) {
      throw { mensagem: "Disciplina não encontrada", status: 404 };
    }

    await conn.query(
      "UPDATE disciplina nome = ?, descricao = ?, url_imagem = ? WHERE disciplina_id = ?",
      [nome, descricao, urlImagem, id]
    );
    await conn.commit();

    return res.status(200).json({ mensagem: "Disciplina atualizada com sucesso" });
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
}

exports.deleteDisciplina = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;

    if (isNaN(id)) {
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const disciplinaExiste = await conn.query("SELECT 1 FROM disciplina WHERE disciplina_id = ?", [id]);
    if (disciplinaExiste.length === 0) {
      throw { mensagem: "Disciplina não encontrada", status: 404 };
    }

    await conn.query("DELETE FROM disciplina WHERE disciplina_id = ?", [id]);
    await conn.commit();

    return res.status(200).json({ mensagem: "Disciplina excluída com sucesso" });
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
}

exports.getProfessoresByDisciplinaId = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;

    if (isNaN(id)) {
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    
    const professores = await conn.query(
      "SELECT professor.* FROM professor \
      INNER JOIN disciplina_professor \
      ON professor.professor_id = disciplina_professor.professor_id \
      WHERE disciplina_professor.disciplina_id = ?", 
      [id]
    );

    if (professores.length === 0) {
      throw { mensagem: "Nenhum professor encontrado para esta disciplina", status: 404 };
    }

    return res.status(200).json(professores);
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
}

exports.getAlunosByDisciplinaId = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;

    if (isNaN(id)) {
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    
    const alunos = await conn.query(
      "SELECT aluno.* FROM aluno \
      INNER JOIN disciplina_aluno \
      ON aluno.aluno_id = disciplina_aluno.aluno_id \
      WHERE disciplina_aluno.disciplina_id = ?", 
      [id]
    );

    if (alunos.length === 0) {
      throw { mensagem: "Nenhum aluno encontrado para esta disciplina", status: 404 };
    }

    return res.status(200).json(alunos);
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { ...exports };
