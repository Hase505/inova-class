const express = require("express");
const router = express.Router();
const professorController = require("../controllers/professoresController");

router.get('/', professorController.getProfessores);
router.post('/', professorController.postProfessor);

router.get('/:id', professorController.getProfessorById);
router.put('/:id', professorController.putProfessor);
router.delete('/:id', professorController.deleteProfessor);

router.get('/:id/disciplinas', professorController.getDisciplinaOfProfessorById);

module.exports = router;
