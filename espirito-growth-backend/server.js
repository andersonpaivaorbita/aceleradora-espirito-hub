require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('senha', senha)
    .single();

  if (error || !data) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: data.id, email: data.email }, process.env.JWT_SECRET);
  res.json({ token });
});

app.get('/dashboard/startup', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('startups')
    .select('*')
    .eq('usuario_id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: 'Erro ao buscar dados da startup' });
  res.json(data);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
