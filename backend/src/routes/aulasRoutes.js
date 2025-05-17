const express = require('express');
const router = express.Router();
const aulasController = require('../controllers/aulasController');

router.get('/:id', aulasController.getAulasById);
router.put('/:id', aulasController.putAulas);
router.delete('/:id', aulasController.deleteAulas);

router.get('/', aulasController.getAulasByDisciplina);
router.post('/', aulasController.postAulas);

module.exports = router;
