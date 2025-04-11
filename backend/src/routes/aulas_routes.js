const express = require('express');
const router = express.Router();
const aulasController = require('../controllers/aulas_controller');

router.get('/', aulasController.getAulasByDisciplina);
router.get('/:id', aulasController.getAulasById);

router.post('/', aulasController.postAulas);

module.exports = router;
