import http from 'http';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const apiKey = process.env.GENAI_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey });

const server = http.createServer(async (req, res) => {
  // ✅ /genai API 처리
  if (req.method === 'POST' && req.url === '/genai') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {

      const safetySettings = [
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        }
      ];

      try {
        const { contents, model } = JSON.parse(body);
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          safety_settings: safetySettings,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: response }));
      } catch (e) {
        console.error(e);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'API 호출 실패' }));
      }
    });
    return;
  }

  // ✅ 정적 파일 처리 (html, css, js, img 등 자동 대응)
  const filePath = path.join(process.cwd(), 'public', req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('❌ 파일을 찾을 수 없습니다');
    } else {
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중! http://localhost:${PORT}`);
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.ico': return 'image/x-icon';
    case '.svg': return 'image/svg+xml';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}
