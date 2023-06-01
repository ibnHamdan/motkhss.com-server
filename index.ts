import express from 'express';
const app = express();
const PORT = process.env.PORT || 8080;

export interface QueryPayload {
  foo: string;
}

const path = __dirname + '/build/';

app.use(express.static(path));

app.get('/', function (req, res) {
  res.sendFile(path + 'index.html');
});

app.get('/test', (req, res) => {
  const data: QueryPayload = { foo: 'bar ..' };
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
