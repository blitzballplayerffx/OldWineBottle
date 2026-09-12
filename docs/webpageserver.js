#!/usr/bin/env node
// Simple static file server for local testing
// Usage: node webpageserver.js [port]

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.argv[2], 10) || process.env.PORT || 3000;

// Determine site root so the server works whether this script lives at the
// repository root or inside the docs/ directory. If this file is inside a
// directory named "docs", serve that directory. Otherwise serve the
// "docs" subdirectory next to this script.
let ROOT;
if (path.basename(__dirname) === 'docs') {
  ROOT = __dirname;
} else {
  ROOT = path.join(__dirname, 'docs');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('404 Not Found');
}

function safeJoin(root, p) {
  const decoded = decodeURIComponent(p);
  const normalized = path.normalize(decoded).replace(/^\0/, '');
  return path.join(root, normalized);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/');
  let pathname = parsed.pathname || '/';

  // Default to index.html for root or directory requests
  let filePath = safeJoin(ROOT, pathname);

  // Prevent escaping the root directory
  if (!filePath.startsWith(ROOT)) {
	send404(res);
	return;
  }

  fs.stat(filePath, (err, stats) => {
	if (err) {
	  send404(res);
	  return;
	}

	if (stats.isDirectory()) {
	  filePath = path.join(filePath, 'index.html');
	}

	fs.stat(filePath, (err2, stats2) => {
	  if (err2 || !stats2.isFile()) {
		send404(res);
		return;
	  }

	  const ext = path.extname(filePath).toLowerCase();
	  const contentType = MIME[ext] || 'application/octet-stream';
	  res.statusCode = 200;
	  res.setHeader('Content-Type', contentType);
	  res.setHeader('Cache-Control', 'no-cache');

	  const stream = fs.createReadStream(filePath);
	  stream.on('error', () => send404(res));
	  stream.pipe(res);
	});
  });
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}/`);
});
