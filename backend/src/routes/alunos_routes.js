const express = require("express");
const router = express.Router();
const aluno_controller = require("../controllers/alunos_controller");

router.get('/', aluno_controller.get_alunos);
router.post('/', aluno_controller.post_alunos);

router.get('/:id', aluno_controller.get_alunos_by_id);
router.put('/:id', aluno_controller.put_alunos);
router.delete('/:id', aluno_controller.delete_alunos);

router.get('/:id/presencas', aluno_controller.get_presencas_by_aluno_id);
router.get('/:id/disciplinas', aluno_controller.get_disciplina_by_aluno_id);
router.get('/:id/curso', aluno_controller.get_curso_by_aluno_id);


module.exports = router;
