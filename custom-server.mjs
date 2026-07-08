import next from 'next';
import http from 'http';
process.on('exit', (c) => console.log('PROCESS EXIT', c));
const app = next({ dev: true, dir: process.cwd() });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  console.log('prepared');
  const server = http.createServer((req, res) => handle(req, res));
  server.listen(5002, '0.0.0.0', () => {
    console.log('> Custom server ready on 5002');
  });
}).catch(err => {
  console.error('PREPARE ERROR', err);
  process.exit(1);
});
