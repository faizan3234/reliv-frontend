# ESP32 + 3 DC Motors + 3 Relay Module (MQTT Controlled)

## Hardware Overview
- **ESP32** microcontroller
- **3x DC Motors** (each with 3 wires: Red = +12V, Black = -12V, Brown = +12V trigger)
- **3x Single-channel Relay Modules** (to switch each motor)
- **12V Power Supply** (for motors)

## Wiring Diagram
```
[ESP32 GPIO] ----> [Relay IN] ----> [Relay NO/COM] ----> [Brown wire of DC Motor]
[Red wire of DC Motor] ----> +12V Power
[Black wire of DC Motor] ----> -12V Power

For each motor:
- ESP32 GPIO (e.g. GPIO 18, 19, 21) connects to relay IN pin
- Relay VCC/GND to ESP32 3.3V/GND
- Relay NO (Normally Open) to Brown wire
- Relay COM to +12V
- Red wire to +12V
- Black wire to -12V
```

## MQTT Command Format
Send a JSON message to topic `kiosk/relay/dispense`:
```json
{
  "motor": 1,        // 1 = Women's Kit, 2 = Travel Kit, 3 = First Aid Kit
  "quantity": 5      // Number of rotations (dispenses)
}
```
You can send multiple commands for different motors/kits.

## ESP32 Code (Arduino Framework)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "relief";
const char* password = "RELIVETEAM-17";

// MQTT broker
const char* mqtt_server = "YOUR_MQTT_BROKER";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// Relay GPIO pins
#define RELAY1_PIN 18 // Motor 1 (Women's Kit)
#define RELAY2_PIN 19 // Motor 2 (Travel Kit)
#define RELAY3_PIN 21 // Motor 3 (First Aid Kit)

void setup() {
  Serial.begin(115200);
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  digitalWrite(RELAY3_PIN, LOW);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32RelayClient")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc="); Serial.print(client.state());
      delay(2000);
    }
  }
  client.subscribe("kiosk/relay/dispense");
}

void loop() {
  client.loop();
}

void activateRelay(int relayPin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(relayPin, HIGH); // Activate relay (motor ON)
    delay(500);                   // Motor ON duration (adjust as needed)
    digitalWrite(relayPin, LOW);  // Deactivate relay (motor OFF)
    delay(500);                   // Pause between rotations
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.print("MQTT message: "); Serial.println(msg);

  // Parse JSON
  int motor = 0, quantity = 0;
  if (msg.indexOf("motor") >= 0 && msg.indexOf("quantity") >= 0) {
    int mIdx = msg.indexOf("motor");
    int qIdx = msg.indexOf("quantity");
    motor = msg.substring(mIdx + 7, msg.indexOf(',', mIdx)).toInt();
    quantity = msg.substring(qIdx + 10, msg.indexOf('}', qIdx)).toInt();
  }

  if (motor >= 1 && motor <= 3 && quantity > 0) {
    int relayPin = (motor == 1) ? RELAY1_PIN : (motor == 2) ? RELAY2_PIN : RELAY3_PIN;
    activateRelay(relayPin, quantity);
    Serial.printf("Motor %d rotated %d times\n", motor, quantity);
  }
}

## How It Works
- When an MQTT message is received, ESP32 parses the motor number and quantity.
- Only the requested motor's relay is activated, for the exact number of times specified.
- Each activation rotates the motor once (duration can be tuned in `delay(500)`).
- No other motor is triggered.

## Example
If you buy:
- Women's Kit x5 → send `{ "motor": 1, "quantity": 5 }`
- Travel Kit x2 → send `{ "motor": 2, "quantity": 2 }`

Motor 1 will rotate 5 times, Motor 2 will rotate 2 times, Motor 3 stays off.

## Notes
- Adjust relay ON/OFF duration (`delay(500)`) for your motor's rotation time.
- Use a proper 12V power supply for motors.
- Relays switch the brown trigger wire to +12V to activate the motor.
- Make sure ESP32 GND is connected to relay module GND.
- You can expand to more motors by adding more relays and GPIOs.

---
**If you need a more advanced JSON parser or want to support multiple motors in one message, let me know!**
