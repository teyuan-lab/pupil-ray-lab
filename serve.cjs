const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const allowed=new Set(['/index.html','/app.js','/optics.js','/eye.js','/style.css']);
http.createServer((req,res)=>{const p=req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0];if(!allowed.has(p)){res.writeHead(404);return res.end();}fs.readFile(path.join(__dirname,p),(e,b)=>{res.writeHead(e?404:200,{'Content-Type':p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html'});res.end(e?'Not found':b);});}).listen(8795,'127.0.0.1',()=>console.log('http://127.0.0.1:8795'));
