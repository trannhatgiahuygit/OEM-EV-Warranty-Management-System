# AI Features (Gemini) - OEM EV Warranty Management System

This module adds AI-powered:
- Failure cause analysis (Gemini LLM)
- Warranty cost forecasting (heuristics + Gemini recommendations)

## Setup

1) Configure Gemini API:
- Set environment variable `GEMINI_API_KEY` with your key
- Or set in `src/main/resources/application.properties`:
```
ai.gemini.api-key=YOUR_KEY
ai.gemini.model=gemini-1.5-flash
ai.gemini.api-base-url=https://generativelanguage.googleapis.com/v1beta
```

2) Build
```
./mvnw -DskipTests package
```

3) Run
```
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

## APIs

- POST `/api/ai/analyze-failures`
  Body example:
```
{
  "timeframe": "LAST_6_MONTHS",
  "vehicleModel": "Model X",
  "groupBy": "PART",
  "topN": 10
}
```

- POST `/api/ai/predict-costs`
  Body example:
```
{
  "forecastPeriod": "NEXT_12_MONTHS",
  "granularity": "MONTHLY",
  "vehicleModel": "Model X",
  "includeConfidenceInterval": true
}
```

Both endpoints return structured DTOs with insights and recommendations.

## Notes
- Failure grouping is computed from historical claim items (part/category/model)
- Gemini generates natural-language summaries and recommendations
- Forecast baseline uses moving-average + simple slope; feel free to swap with a proper time-series model later

