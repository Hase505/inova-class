const express = require('express');
const router = express.Router();
const disciplinasController = require('../controllers/disciplinasController.js');

router.get('/:id', disciplinasController.getDisciplinaById);
router.get('/:id/professores', disciplinasController.getProfessoresByDisciplinaId);
router.get('/:id/alunos', disciplinasController.getAlunosByDisciplinaId);
router.put('/:id', disciplinasController.putDisciplina);
router.delete('/:id', disciplinasController.deleteDisciplina);

router.get('/', disciplinasController.getDisciplinas);
router.post('/', disciplinasController.postDisciplina);

module.exports = router;