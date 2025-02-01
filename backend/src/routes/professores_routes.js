const express = require("express");
const router = express.Router();
const professor_controller = require("../controllers/professores_controller");

router.get('/', professor_controller.get_professores);

module.exports = router;
