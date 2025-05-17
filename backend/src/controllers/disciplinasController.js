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

exports.postDisciplinaProfessor = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;
    const { professor_id: professorId } = req.body;

    if (isNaN(id)) {
      throw { mensagem: "ID inválido", status: 400 };
    }
    // Verificar se todos os campos obrigatórios foram preenchidos
    if (!professorId) {
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }

    // Verificar se os dados são válidos
    if (isNaN(professorId)) {
      throw { mensagem: "Dados inválidos", status: 400 };
    }
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const disciplinaExiste = await conn.query("SELECT 1 FROM disciplina WHERE disciplina_id = ?", [id]);
    if (disciplinaExiste.length === 0) {
      throw { mensagem: "Disciplina não encontrada", status: 404 };
    }

    const professorExiste = await conn.query("SELECT 1 FROM professor WHERE professor_id = ?", [professorId]);
    if (professorExiste.length === 0) {
      throw { mensagem: "Professor não encontrado", status: 404 };
    }

    const disciplinaProfessor = await conn.query("SELECT 1 FROM disciplina_professor WHERE disciplina_id = ? AND professor_id = ?", [id, professorId]);
    if (disciplinaProfessor.length > 0) {
      throw { mensagem: "Relação já existe", status: 409 };
    }

    await conn.query(
      "INSERT INTO disciplina_professor (disciplina_id, professor_id) VALUES (?, ?)",
      [id, professorId]
    );
    await conn.commit();

    return res.status(201).json({ mensagem: "Relação criada com sucesso" });
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  }
  finally {
    if (conn) conn.release();
  }
}

exports.deleteDisciplinaProfessor = async (req, res) => {
  let conn;

  try {
    const { id: idDisciplina, idProfessor } = req.params;

    if (isNaN(idDisciplina) || isNaN(idProfessor)) {
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const disciplinaProfessor = await conn.query("SELECT 1 FROM disciplina_professor WHERE disciplina_id = ? AND professor_id = ?", [idDisciplina, idProfessor]);
    if (disciplinaProfessor.length === 0) {
      throw { mensagem: "Relação não encontrada", status: 404 };
    }

    await conn.query("DELETE FROM disciplina_professor WHERE disciplina_id = ? AND professor_id = ?", [idDisciplina, idProfessor]);
    await conn.commit();

    return res.status(200).json({ mensagem: "Relação excluída com sucesso" });
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
}

exports.postDisciplinaAluno = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;
    const { aluno_id: alunoId } = req.body;

    if (isNaN(id)) {
      throw { mensagem: "ID inválido", status: 400 };
    }
    // Verificar se todos os campos obrigatórios foram preenchidos
    if (!alunoId) {
      throw { mensagem: "Todos os campos são obrigatórios", status: 400 };
    }

    // Verificar se os dados são válidos
    if (isNaN(alunoId)) {
      throw { mensagem: "Dados inválidos", status: 400 };
    }
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const disciplinaExiste = await conn.query("SELECT 1 FROM disciplina WHERE disciplina_id = ?", [id]);
    if (disciplinaExiste.length === 0) {
      throw { mensagem: "Disciplina não encontrada", status: 404 };
    }

    const alunoExiste = await conn.query("SELECT 1 FROM aluno WHERE aluno_id = ?", [alunoId]);
    if (alunoExiste.length === 0) {
      throw { mensagem: "Aluno não encontrado", status: 404 };
    }

    const disciplinaAluno = await conn.query("SELECT 1 FROM disciplina_aluno WHERE disciplina_id = ? AND aluno_id = ?", [id, alunoId]);
    if (disciplinaAluno.length > 0) {
      throw { mensagem: "Relação já existe", status: 409 };
    }

    await conn.query(
      "INSERT INTO disciplina_aluno (disciplina_id, aluno_id) VALUES (?, ?)",
      [id, alunoId]
    );
    await conn.commit();

    return res.status(201).json({ mensagem: "Relação criada com sucesso" });
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  }
  finally {
    if (conn) conn.release();
  }
}

exports.deleteDisciplinaAluno = async (req, res) => {
  let conn;

  try {
    const { id: idDisciplina, idAluno } = req.params;

    if (isNaN(idDisciplina) || isNaN(idAluno)) {
      throw { mensagem: "ID inválido", status: 400 };
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const disciplinaAluno = await conn.query("SELECT 1 FROM disciplina_aluno WHERE disciplina_id = ? AND aluno_id = ?", [idDisciplina, idAluno]);
    if (disciplinaAluno.length === 0) {
      throw { mensagem: "Relação não encontrada", status: 404 };
    }

    await conn.query("DELETE FROM disciplina_aluno WHERE disciplina_id = ? AND aluno_id = ?", [idDisciplina, idAluno]);
    await conn.commit();

    return res.status(200).json({ mensagem: "Relação excluída com sucesso" });
  } catch (erro) {
    const statusCode = erro.status || 500;
    return res.status(statusCode).json({ error: erro.mensagem || "Erro interno no servidor" });
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { ...exports };
