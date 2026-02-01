#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// 1. CONFIGURAÇÕES
// ==========================================
const char* ssid = "Fretas_2GG";
const char* password = "123456789";

// URL do Backend Web Service no Render
String server_url = "https://bakendgestaolim.onrender.com"; 
String nome_carrinho = "LIM01";

// Intervalo entre verificações (ms)
const int INTERVALO_CHECK = 3000; 

// ==========================================
// 2. PINAGEM (HARDWARE)
// ==========================================
const int PINO_TRAVA = 4;   // Relé / Trava
const int PINO_LED   = 2;   // LED Indicador

// ==========================================
// 3. VARIÁVEIS GLOBAIS
// ==========================================
String ultimoStatus = "";
unsigned long ultimaVerificacao = 0;

// Controle do LED temporizado
bool ledAtivo = false;
unsigned long tempoInicioLed = 0;
const int TEMPO_LED_LIGADO = 10000; // 10s

// ==========================================
// 4. FUNÇÕES AUXILIARES
// ==========================================

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("📡 Conectando Wi-Fi [");
  Serial.print(ssid);
  Serial.print("] ");

  WiFi.begin(ssid, password);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    tentativas++;
    if (tentativas > 20) { // Retry logic
        Serial.println("\n⚠️ Demorando muito. Reiniciando WiFi...");
        WiFi.disconnect();
        WiFi.begin(ssid, password);
        tentativas = 0;
    }
  }

  Serial.println("\n✅ Wi-Fi Conectado!");
  Serial.print("📍 IP: ");
  Serial.println(WiFi.localIP());
}

void controlarLED() {
  // Desliga o LED automaticamente após o tempo definido
  if (ledAtivo && (millis() - tempoInicioLed >= TEMPO_LED_LIGADO)) {
    digitalWrite(PINO_LED, LOW);
    ledAtivo = false;
    Serial.println("💡 LED desligado (tempo esgotado)");
  }
}

void processarResposta(String payload) {
  // O backend retorna algo como "STATUS:EM_USO" ou "STATUS:DISPONIVEL"
  String statusAtual = "";

  if (payload.indexOf("STATUS:EM_USO") >= 0) {
    statusAtual = "EM_USO";
  } 
  else if (payload.indexOf("STATUS:DISPONIVEL") >= 0) {
    statusAtual = "DISPONIVEL";
  } 
  else {
    Serial.println("⚠️ Resposta desconhecida ou Erro no formato.");
    return;
  }

  // Se o status mudou, toma uma ação
  if (statusAtual != ultimoStatus) {
    Serial.println("--------------------------------");
    Serial.print("🔄 MUDANÇA DE STATUS: ");
    Serial.print(ultimoStatus);
    Serial.print(" -> ");
    Serial.println(statusAtual);

    if (statusAtual == "EM_USO") {
      Serial.println("🔓 Ação: DESTRAVAR (Carrinho Retirado)");
      digitalWrite(PINO_TRAVA, HIGH); 
    } 
    else if (statusAtual == "DISPONIVEL") {
      Serial.println("🔒 Ação: TRAVAR (Carrinho Devolvido)");
      digitalWrite(PINO_TRAVA, LOW);
    }

    // Pisca LED para avisar mudança
    digitalWrite(PINO_LED, HIGH);
    tempoInicioLed = millis();
    ledAtivo = true;

    ultimoStatus = statusAtual;
    Serial.println("--------------------------------");
  }
}

// ==========================================
// 5. SETUP E LOOP
// ==========================================

void setup() {
  Serial.begin(115200);
  
  // Configura Pinos
  pinMode(PINO_TRAVA, OUTPUT);
  pinMode(PINO_LED, OUTPUT);
  
  // Estado inicial seguro
  digitalWrite(PINO_TRAVA, LOW); 
  digitalWrite(PINO_LED, LOW);

  Serial.println("\n🚀 INICIANDO SISTEMA DO CARRINHO - " + nome_carrinho);
  
  conectarWiFi();
}

void loop() {
  controlarLED();
  
  // Verifica conexão
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Wi-Fi caiu! Reconectando...");
    conectarWiFi();
  }

  // Executa requisição periodicamente
  if (millis() - ultimaVerificacao >= INTERVALO_CHECK) {
    ultimaVerificacao = millis();
    
    HTTPClient http;
    String full_url = server_url + "/api/esp32/get_status?nome=" + nome_carrinho;

    // Render as vezes requer User-Agent
    http.setUserAgent("ESP32/HTTPClient");
    
    // Inicia conexão
    // Nota: Se der erro de SSL, usar client.setInsecure() antes (mas HTTPClient moderno do ESP32 costuma lidar bem)
    // Para garantir compatibilidade total com HTTPS do Render:
    WiFiClientSecure *client = new WiFiClientSecure;
    if(client) {
      client->setInsecure(); // Ignora validação rigorosa de certificado (bom para protótipos)
      http.begin(*client, full_url);
      
      int httpCode = http.GET();

      if (httpCode > 0) {
        String payload = http.getString();
        // Serial.println("📡 Resposta: " + payload); // Debug verbose se precisar
        processarResposta(payload);
      } else {
        Serial.print("❌ Erro na requisição HTTP: ");
        Serial.println(http.errorToString(httpCode).c_str());
      }
      
      http.end();
      delete client;
    } else {
       Serial.println("❌ Erro ao criar cliente seguro");
    }
  }
}
