const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuarios_controller");

router.get('/', usuariosController.getUsuarios);
router.post('/', usuariosController.postUsuario);

router.get('/:id', usuariosController.getUsuarioById);

router.post('/login', usuariosController.postLogin);

router.get('/me', usuariosController.getValidateMe);

module.exports = router;
