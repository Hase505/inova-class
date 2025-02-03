#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// Configurações do Wi-Fi
const char* ssid = "SSID DO WIFI";
const char* password = "SENHA";

const char* rfid_tag = "TAG QUE SERÁ ENVIADA";
const char* id_sala = "1";

// URL da API
const char* serverUrl = "http://localhost/presencas";

// Definições do RFID
#define SS_PIN 21
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

void setup() {
        Serial.begin(115200);
    
	// Conectar ao Wi-Fi
    	WiFi.begin(ssid, password);
    	Serial.print("Conectando ao Wi-Fi...");
    	while (WiFi.status() != WL_CONNECTED) {
		delay(1000);
		Serial.print(".");
	}
	Serial.println("\nConectado ao Wi-Fi!");

	// Inicializar RFID
	SPI.begin(18, 19, 23);
	rfid.PCD_Init();
	Serial.println("RFID inicializado.");
}

void loop() {
	if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
		String uid = getUID();
		Serial.println("Cartão detectado: " + uid);
		sendToAPI(uid);

		rfid.PICC_HaltA();
		rfid.PCD_StopCrypto1();
	}
    	delay(1000);
}

// Obtém o UID do cartão como String
String getUID() {
	String uidStr = "";
	for (byte i = 0; i < rfid.uid.size; i++) {
		uidStr += String(rfid.uid.uidByte[i], HEX);
	}
	return uidStr;
}

// Envia o UID para a API via HTTP POST
void sendToAPI(String uid) {
	if (WiFi.status() == WL_CONNECTED) {
        	HTTPClient http;
        
        	http.begin(serverUrl);
        	http.addHeader("Content-Type", "application/json");
       
        	String payload = "{";
        	payload += "\"rfid_tag\":\"" + uid + "\",";
        	payload += "\"id_sala\":\"" + String(id_sala) + "\"";
        	payload += "}";

        	int httpResponseCode = http.POST(payload);

        	Serial.print("Resposta da API: ");
        	Serial.println(httpResponseCode);
        	http.end();
	} else {
        	Serial.println("Erro: Wi-Fi desconectado.");
	}
}
