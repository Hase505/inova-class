const express = require("express");
const router = express.Router();
const presencas_controller = require("../controllers/presencas_controller");

router.get('/:id', presencas_controller.get_presenca_by_id);
router.post('/', presencas_controller.post_presenca);

module.exports = router;
