const express = require("express");
const router = express.Router();
const alunosController = require("../controllers/alunosController");

router.get('/', alunosController.getAlunos);
router.post('/', alunosController.postAlunos);

router.get('/:id', alunosController.getAlunosById);
router.put('/:id', alunosController.putAlunos);
router.delete('/:id', alunosController.deleteAlunos);

router.get('/:id/presencas', alunosController.getPresencasByAlunoId);
router.get('/:id/disciplinas', alunosController.getDisciplinaByAlunoId);
router.get('/:id/curso', alunosController.getCursoByAlunoId);


module.exports = router;
