const express = require('express');
const aluno_routes = require('./routes/alunos_routes');
const professor_routes = require('./routes/professores_routes');
const presencas_routes = require('./routes/presencas_routes');

const app = express();
app.use(express.json());

app.use('/alunos', aluno_routes);
app.use('/professores', professor_routes);
app.use('/presencas', presencas_routes);

module.exports = app;
