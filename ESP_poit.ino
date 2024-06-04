#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_MAX31865.h>
#include <ArduinoJson.h>

#define LDR 34
int ldrValue;
float temp;

// Use software SPI: CS, DI, DO, CLK
Adafruit_MAX31865 thermo = Adafruit_MAX31865(5, 23, 19, 18);
// The value of the Rref resistor. Use 430.0 for PT100 and 4300.0 for PT1000
#define RREF      430.0
// The 'nominal' 0-degrees-C resistance of the sensor
// 100.0 for PT100, 1000.0 for PT1000
#define RNOMINAL  100.0

void setup() {
  // Serial port for debugging purposes
  Serial.begin(115200);
  thermo.begin(MAX31865_3WIRE);  // set to 2WIRE or 4WIRE as necessary for PT100 RTD sensor
}

void loop() {
  ldrValue = analogRead(LDR); // read the value from the LDR sensor
  
  // Read the temperature
  temp = thermo.temperature(RNOMINAL, RREF);

  // Create a JSON object
  StaticJsonDocument<200> doc;
  doc["temperature"] = temp;
  doc["light"] = ldrValue;

  // Serialize JSON to string
  String json;
  serializeJson(doc, json);
  
  // Print JSON string to Serial
  Serial.println(json);

  delay(1000);
}
