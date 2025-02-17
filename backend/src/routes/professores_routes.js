const express = require("express");
const router = express.Router();
const professor_controller = require("../controllers/professores_controller");

router.get('/', professor_controller.get_professores);
router.get('/:id', professor_controller.get_professor_by_id);
router.get('/:id/disciplinas', professor_controller.get_disciplina_of_professor_by_id);
router.post('/', professor_controller.post_professor);
router.put('/:id', professor_controller.put_professor);
router.delete('/:id', professor_controller.get_professores);

module.exports = router;
