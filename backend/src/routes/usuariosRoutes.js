const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuariosController");

router.get('/me', usuariosController.getValidateMe);
router.post('/login', usuariosController.postLogin);

router.get('/:id/professor', usuariosController.getProfessorByUsuarioId);
router.get('/:id/aluno', usuariosController.getAlunoByUsuarioId);

router.get('/:id', usuariosController.getUsuarioById);
router.put('/:id', usuariosController.putUsuario);
router.delete('/:id', usuariosController.deleteUsuario);

router.get('/', usuariosController.getUsuarios);
router.post('/', usuariosController.postUsuario);

module.exports = router;
