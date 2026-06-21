const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.argv[2] || process.env.PORT || 4173);
const host = '127.0.0.1';
const siteDir = path.resolve(__dirname, '..', 'site');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function resolveSafePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const target = cleanPath === '/' ? '/index.html' : cleanPath;
  const fullPath = path.resolve(siteDir, '.' + target);
  if (!fullPath.startsWith(siteDir)) {
    return null;
  }
  return fullPath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveSafePath(req.url || '/');
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Preview URL: http://${host}:${port}`);
  console.log(`Site folder: ${siteDir}`);
});
