const express = require("express");
const router = express.Router();
const presencas_controller = require("../controllers/presencas_controller");

router.get('/:id', presencas_controller.get_presenca_by_id);
router.get('/', presencas_controller.get_presencas_by_aula_id);
router.post('/', presencas_controller.post_presenca);
router.put('/:id', presencas_controller.put_presenca);
router.delete('/:id', presencas_controller.delete_presenca);

module.exports = router;
