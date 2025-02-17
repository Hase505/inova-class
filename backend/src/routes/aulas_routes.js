const express = require('express');
const router = express.Router();
const aulas_controller = require('../controllers/aulas_controller');

router.get('/', aulas_controller.get_aulas_by_disciplina);
router.get('/', aulas_controller.get_aulas);
router.get('/:id', aulas_controller.get_aulas_by_id);

module.exports = router;
