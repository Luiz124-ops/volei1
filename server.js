require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20
});
app.use('/api/', limiter);

const db = new sqlite3.Database('./volei.db', (err) => {
  if (err) console.error('Erro ao conectar no banco:', err.message);
  else console.log('Conectado ao banco SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS alunos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  idade INTEGER,
  turma TEXT
)`);

app.post('/api/alunos',
  [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório.'),
    body('email').isEmail().withMessage('Email inválido.'),
    body('idade').isInt({ min: 5, max: 100 }).withMessage('Idade fora do intervalo permitido.'),
    body('turma').notEmpty().withMessage('Turma é obrigatória.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
    }

    const { nome, email, idade, turma } = req.body;

    const sql = `INSERT INTO alunos (nome, email, idade, turma) VALUES (?, ?, ?, ?)`;
    db.run(sql, [nome, email, idade, turma], function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID, nome, email, idade, turma });
    });
  }
);

app.get('/api/alunos', (req, res) => {
  db.all(`SELECT * FROM alunos`, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
