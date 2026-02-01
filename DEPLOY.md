# Como Rodar no Render (Deployment)

Para colocar este projeto no ar (online) pelo Render, você vai precisar criar **dois serviços** conectados ao seu GitHub: um para o Site (Frontend) e outro para o Servidor (Backend).

## 1. Preparação (Git)
Certifique-se de que esta pasta (`gestaolim-main`) é a raiz do seu repositório no GitHub.
- O arquivo `package.json` deve estar na raiz.
- A pasta `backend` deve estar na raiz.

## 2. Criar o Servidor (Backend)
No painel do Render (Dashboard), clique em **New +** -> **Web Service**.
1.  Conecte seu repositório do GitHub.
2.  **Name**: `gestaolim-backend` (ou o nome que preferir).
3.  **Root Directory**: `backend` (IMPORTANTE: digite `backend` aqui).
4.  **Runtime**: `Python 3`.
5.  **Build Command**: `pip install -r requirements.txt`.
6.  **Start Command**: `gunicorn app:app`.
7.  Clique em **Create Web Service**.
8.  **Aguarde**: Quando terminar, copie a URL dele (ex: `https://gestaolim-backend.onrender.com`).

> **Atenção**: Como estamos usando SQLite (arquivo local), se o servidor reiniciar (free tier), o banco de dados pode resetar. Para um banco permanente real com SQLite no Render, você precisaria criar um "Disk" (pago) ou configurar um banco externo. Mas para rodar igual ao "Rafa" (arquivo simples), essa configuração funciona (com o risco de reset).

## 3. Criar o Site (Frontend)
No painel do Render, clique em **New +** -> **Static Site**.
1.  Conecte o mesmo repositório.
2.  **Name**: `gestaolim-frontend`.
3.  **Root Directory**: Deixe em branco (ou `.`).
4.  **Build Command**: `npm install; npm run build`.
5.  **Publish Directory**: `dist`.
6.  **Environment Variables** (IMPORTANTE):
    - Clique em "Advanced" ou "Environment Variables".
    - Adicione uma chave chamada `VITE_API_URL`.
    - No valor, cole a URL do Backend que você copiou no passo 2 (ex: `https://gestaolim-backend.onrender.com`).
    - *Nota: Não coloque a barra `/` no final da URL.*
7.  Clique em **Create Static Site**.

## 4. Atualizar o ESP32
1.  Abra o arquivo `esp32_firmware.ino`.
2.  Atualize a linha:
    ```cpp
    String server_url = "https://gestaolim-backend.onrender.com"; // Use a URL do SEU Backend aqui
    ```
3.  Carregue o código no ESP32.

Pronto! O sistema estará rodando online.
