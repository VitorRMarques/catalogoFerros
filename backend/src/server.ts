import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { produtoRouter } from './routes/produtos.js';
import { tiposRouter } from './routes/tipos.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/produtos', produtoRouter);
app.use('/tipos', tiposRouter)


const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});