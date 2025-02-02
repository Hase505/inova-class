const app = require('./app');
const PORT = 80;

app.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});
