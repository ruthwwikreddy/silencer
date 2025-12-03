// Enviromotive - MQ7 Before/After Logger (NO OLED)

#include <Arduino.h>

// Sensor pins
const uint8_t MQ_BEFORE_PIN = A0;
const uint8_t MQ_AFTER_PIN = A1;

// Simple smoothing
const uint8_t SMOOTH_SAMPLES = 6;
float beforeBuffer[SMOOTH_SAMPLES];
float afterBuffer[SMOOTH_SAMPLES];
uint8_t idx = 0;

// Calibration constants (PLACEHOLDERS)
const float CAL_A = 5.0;
const float CAL_B = -10.0;

// Highest values tracking
float highestBefore = 0;
float highestAfter = 0;
float highestReduction = 0;

// Convert analog(0–1023) → ppm (placeholder)
float analogToPpm(int analogVal) {
  float ppm = CAL_A * analogVal + CAL_B;
  if (ppm < 0)
    ppm = 0;
  return ppm;
}

float smoothAverage(float *buf) {
  float s = 0;
  for (uint8_t i = 0; i < SMOOTH_SAMPLES; i++) {
    s += buf[i];
  }
  return s / SMOOTH_SAMPLES;
}

void setup() {
  Serial.begin(9600);
  delay(500);

  Serial.println("Enviromotive MQ7 Logger Started...");
  Serial.println("Initializing...");

  int b0 = analogRead(MQ_BEFORE_PIN);
  int a0 = analogRead(MQ_AFTER_PIN);

  for (uint8_t i = 0; i < SMOOTH_SAMPLES; i++) {
    beforeBuffer[i] = b0;
    afterBuffer[i] = a0;
  }

  Serial.println("Ready.\n");
}

void loop() {

  // Read raw values
  int rawBefore = analogRead(MQ_BEFORE_PIN);
  int rawAfter = analogRead(MQ_AFTER_PIN);

  // Update smoothing buffer
  beforeBuffer[idx] = rawBefore;
  afterBuffer[idx] = rawAfter;
  idx = (idx + 1) % SMOOTH_SAMPLES;

  // Smoothed values
  float smBefore = smoothAverage(beforeBuffer);
  float smAfter = smoothAverage(afterBuffer);

  // Convert to ppm
  float ppmBefore = analogToPpm(round(smBefore));
  float ppmAfter = analogToPpm(round(smAfter));

  // Reduction %
  float reductionPct = 0;
  if (ppmBefore > 0.001) {
    reductionPct = (ppmBefore - ppmAfter) / ppmBefore * 100.0;
    if (reductionPct < 0)
      reductionPct = 0;
  }

  // Update highest records
  if (ppmBefore > highestBefore)
    highestBefore = ppmBefore;
  if (ppmAfter > highestAfter)
    highestAfter = ppmAfter;
  if (reductionPct > highestReduction)
    highestReduction = reductionPct;

  // Emit JSON for the web app
  // Emit JSON for the web app
  Serial.print("{\"before\":");
  Serial.print(ppmBefore);
  Serial.print(",\"after\":");
  Serial.print(ppmAfter);
  Serial.print(",\"reduction\":");
  Serial.print(reductionPct);
  Serial.println("}");

  delay(1000);
}