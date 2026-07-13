-- Active: 1750763277253@@127.0.0.1@3306@dbmanager
create database dbmanager;
use dbmanager;

create table users(
    id int not null AUTO_INCREMENT,
    nome varchar(200) not null,
    email varchar(200) not null,
    password VARCHAR(200) not null,
    PRIMARY key(id)
);

CREATE TABLE conexoes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100) NOT NULL,
    descricao TEXT,

    host VARCHAR(200) NOT NULL,
    porta INT DEFAULT 3306,
    usuario VARCHAR(100) NOT NULL,
    senha TEXT NOT NULL,

    tipo ENUM('mysql','mariadb') DEFAULT 'mysql',
    ssl_active BOOLEAN DEFAULT 0,
    ativo BOOLEAN DEFAULT 1,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

