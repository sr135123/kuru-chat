import http from 'http';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';


dotenv.config();

const PORT = process.env.PORT || 3000;
const apiKey = process.env.GENAI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const server = http.createServer(async (req, res) => {
  // 1. GET / → public/index.html 서빙
  if (req.method === 'GET' && req.url === '/') {
    const filePath = path.join(process.cwd(), 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('🔥 index.html 불러오기 실패');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
    return;
  }

    // 이미지 정적 파일 서빙 (/img/ 경로)
    if (req.method === 'GET' && req.url.startsWith('/img/')) {
    const filePath = path.join(process.cwd(), 'public', req.url);
    fs.readFile(filePath, (err, data) => {
        if (err) {
        res.writeHead(404);
        res.end("이미지를 찾을 수 없어요 😢");
        } else {
        res.writeHead(200, { "Content-Type": getImageContentType(filePath) });
        res.end(data);
        }
    });
    return;
    }


  // 2. POST /genai → AI 응답 처리
  if (req.method === 'POST' && req.url === '/genai') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { contents } = JSON.parse(body);
        const result = await model.generateContent(contents);
        const response = await result.response;
        const text = response.text();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: text }));
      } catch (e) {
        console.error(e);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'API 호출 실패' }));
      }
    });
    return;
  }
});

server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중! http://localhost:${PORT}`);
});

function getImageContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}
