const express = require("express");
const router = express.Router();
const presencasController = require("../controllers/presencas_controller");

router.get('/:id', presencasController.getPresencaById);
router.get('/', presencasController.getPresencasByAulaId);
router.post('/', presencasController.postPresenca);
router.put('/:id', presencasController.putPresenca);
router.delete('/:id', presencasController.deletePresenca);

module.exports = router;
