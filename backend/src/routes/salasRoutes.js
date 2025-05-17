const express = require("express");
const router = express.Router();
const salasController = require("../controllers/salasController");

router.get('/:id/aulas', salasController.getAulasBySalaId);

router.get('/:id', salasController.getSalasById);
router.put('/:id', salasController.putSala);
router.delete('/:id', salasController.deleteSala);

router.get('/', salasController.getSalas);
router.post('/', salasController.postSala);

module.exports = router;
