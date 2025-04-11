const express = require("express");
const router = express.Router();
const cursosController = require("../controllers/cursosController");

router.get('/:id/alunos', cursosController.getAlunosByCursoId);
router.get('/:id/disciplinas', cursosController.getDisciplinasByCursoId);

router.get('/:id', cursosController.getCursoById);
router.put('/:id', cursosController.putCurso);
router.delete('/:id', cursosController.deleteCurso);

router.get('/', cursosController.getCursos);
router.post('/', cursosController.postCursos);

module.exports = router;
