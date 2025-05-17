CREATE TABLE usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_senha VARCHAR(255) NOT NULL,
    tipo ENUM('Professor', 'Aluno') NOT NULL
);

CREATE TABLE curso (
    id_curso INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE professor (
    id_professor INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE aluno (
    id_aluno INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT UNIQUE NOT NULL,
    id_curso INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ra INT UNIQUE NOT NULL,
    rfid_tag VARCHAR(30) UNIQUE NOT NULL,
    ano_letivo INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_curso) REFERENCES curso(id_curso)
);

CREATE TABLE disciplina (
    id_disciplina INT PRIMARY KEY AUTO_INCREMENT,
    id_curso INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    url_imagem VARCHAR(512) NOT NULL,
    FOREIGN KEY (id_curso) REFERENCES curso(id_curso)
);

CREATE TABLE disciplina_professor (
    id_disciplina_professor INT PRIMARY KEY AUTO_INCREMENT,
    id_professor INT NOT NULL,
    id_disciplina INT NOT NULL,
    FOREIGN KEY (id_professor) REFERENCES professor(id_professor),
    FOREIGN KEY (id_disciplina) REFERENCES disciplina(id_disciplina)
);

CREATE TABLE disciplina_aluno (
    id_disciplina_aluno INT PRIMARY KEY AUTO_INCREMENT,
    id_aluno INT NOT NULL,
    id_disciplina INT NOT NULL,
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno),
    FOREIGN KEY (id_disciplina) REFERENCES disciplina(id_disciplina)
);

CREATE TABLE sala (
    id_sala INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    bloco INT NOT NULL,
    espaco INT NOT NULL,
    numero_sala INT NOT NULL
);

CREATE TABLE aula (
    id_aula INT PRIMARY KEY AUTO_INCREMENT,
    id_disciplina INT NOT NULL,
    id_sala INT NOT NULL,
    nome_aula VARCHAR(255) NOT NULL,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,
    FOREIGN KEY (id_disciplina) REFERENCES disciplina(id_disciplina),
    FOREIGN KEY (id_sala) REFERENCES sala(id_sala)
);

CREATE TABLE presenca (
    id_presenca INT PRIMARY KEY AUTO_INCREMENT,
    id_aluno INT NOT NULL,
    id_aula INT NOT NULL,
    horario DATETIME NOT NULL,
    presente BOOLEAN NOT NULL,
    FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno),
    FOREIGN KEY (id_aula) REFERENCES aula(id_aula)
);
