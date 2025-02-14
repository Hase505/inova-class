const express = require("express");
const router = express.Router();
const usuarios_controller = require("../controllers/usuarios_controller");

router.get('/', usuarios_controller.get_usuarios);
router.post('/', usuarios_controller.post_usuario);
router.post('/login', usuarios_controller.post_login_user);
router.get('/me', usuarios_controller.get_me_user);
router.get('/:id', usuarios_controller.get_usuario_by_id);

module.exports = router;
