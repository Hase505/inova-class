const express = require('express');
const router = express.Router();
const disciplinasController = require('../controllers/disciplinasController.js');

router.delete('/:id/professores/:professorId', disciplinasController.deleteDisciplinaProfessor);
router.delete('/:id/alunos/:alunoId', disciplinasController.deleteDisciplinaAluno);

router.get('/:id/professores', disciplinasController.getProfessoresByDisciplinaId);
router.post('/:id/professores', disciplinasController.postDisciplinaProfessor);

router.get('/:id/alunos', disciplinasController.getAlunosByDisciplinaId);
router.post('/:id/alunos', disciplinasController.postDisciplinaAluno);

router.get('/:id', disciplinasController.getDisciplinaById);
router.put('/:id', disciplinasController.putDisciplina);
router.delete('/:id', disciplinasController.deleteDisciplina);

router.get('/', disciplinasController.getDisciplinas);
router.post('/', disciplinasController.postDisciplina);

module.exports = router;