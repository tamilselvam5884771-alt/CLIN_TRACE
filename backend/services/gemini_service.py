import os
import json
import logging
from typing import Dict, Any, List, Optional
from backend.config import settings
from backend.schemas import ExtractionFact

logger = logging.getLogger(__name__)

class GeminiExtractionService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    def extract_clinical_info(self, text: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Extracts structured clinical facts from patient text.
        
        CRITICAL BOUNDARY:
        Gemini is ONLY allowed to extract symptoms, severity, duration, and follow-up questions.
        Gemini MUST NEVER return 'urgency', 'department', or 'rule_id'.
        """
        if not text or not text.strip():
            return {
                "extractions": [],
                "confidence_score": 0.0,
                "has_missing_info": True,
                "missing_info_reason": "No text provided by patient.",
                "follow_up_questions": ["Could you please describe what symptoms or discomfort you are experiencing?"]
            }

        # Attempt Gemini API call if key is configured
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                return self._call_gemini_api(text, history)
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}. Falling back to safe extraction parser.")

        # Safe fallback clinical text parser (runs offline or when API key is omitted)
        return self._fallback_clinical_parser(text, history)

    def _call_gemini_api(self, text: str, history: Optional[List[Dict[str, str]]]) -> Dict[str, Any]:
        """Calls Gemini API using urllib / httpx structured prompt request."""
        import httpx

        prompt = f"""You are a clinical intake entity extraction assistant.
Extract structured clinical facts from the patient's description.

Rules:
1. Extract symptoms, severity ('mild', 'moderate', 'severe'), duration in days (integer or null), and additional context.
2. DO NOT determine urgency, department, or rule_id.
3. If critical information (such as severity or duration) is missing, set 'has_missing_info': true, explain why in 'missing_info_reason', and provide 1-2 focused 'follow_up_questions'.
4. If patient statement contains obvious self-contradictions, set 'has_contradiction': true.

Patient Input: "{text}"

Return strictly valid JSON with this structure:
{{
  "extractions": [
    {{
      "symptom": "string",
      "severity": "mild|moderate|severe|null",
      "duration_days": integer_or_null,
      "additional_context": "string_or_null"
    }}
  ],
  "confidence_score": float_between_0_and_1,
  "has_contradiction": boolean,
  "has_missing_info": boolean,
  "missing_info_reason": "string_or_null",
  "follow_up_questions": ["string"]
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={self.api_key}"

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if content_text.startswith("```"):
                    lines = content_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    content_text = "\n".join(lines).strip()
                parsed = json.loads(content_text)
                return self._sanitize_extraction_payload(parsed)
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}")
                return self._fallback_clinical_parser(text, history)


    def _fallback_clinical_parser(self, text: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Rule-based safe offline parser for extracting clinical information when Gemini API is unconfigured.
        """
        lower = text.lower()
        extractions = []
        has_missing_info = False
        missing_reason = None
        follow_ups = []
        has_contradiction = False

        # Check for contradictions
        if ("no pain" in lower or "feel fine" in lower) and ("severe" in lower or "pain" in lower):
            has_contradiction = True

        # Extract Chest Pain
        if "chest" in lower or "angina" in lower:
            severity = "severe" if any(w in lower for w in ["severe", "sharp", "crushing", "extreme", "bad", "8/10", "9/10", "10/10"]) else "moderate"
            extractions.append(
                ExtractionFact(symptom="Chest pain", severity=severity, duration_days=1, additional_context=text)
            )

        # Extract Breathing Difficulty
        if any(w in lower for w in ["breath", "breathing", "dyspnea", "gasping"]):
            severity = "severe" if any(w in lower for w in ["severe", "hard to breath", "cannot breath", "bad"]) else "moderate"
            extractions.append(
                ExtractionFact(symptom="Shortness of breath", severity=severity, duration_days=1, additional_context=text)
            )

        # Extract Injury
        if any(w in lower for w in ["injury", "trauma", "cut", "wound", "fall", "hit", "sprain", "bruise"]):
            severity = "severe" if any(w in lower for w in ["severe", "deep", "head", "fracture", "bleeding"]) else "mild"
            extractions.append(
                ExtractionFact(symptom="Injury / Trauma", severity=severity, duration_days=1, additional_context=text)
            )

        # Extract Abdominal Pain
        if any(w in lower for w in ["stomach", "abdomen", "abdominal", "belly"]):
            severity = "severe" if any(w in lower for w in ["severe", "intense", "extreme", "bad"]) else "mild"
            extractions.append(
                ExtractionFact(symptom="Abdominal pain", severity=severity, duration_days=1, additional_context=text)
            )

        # Extract Fever & Duration parsing
        if any(w in lower for w in ["fever", "temperature", "pyrexia", "warm"]):
            duration = 1
            if "3 days" in lower or "three days" in lower or "4 days" in lower or "four days" in lower or "persistent" in lower or "5 days" in lower:
                duration = 4
            elif "2 days" in lower or "two days" in lower:
                duration = 2
            extractions.append(
                ExtractionFact(symptom="Fever", severity="moderate", duration_days=duration, additional_context=text)
            )

        # Fallback default extraction if no specific symptom was matched
        if not extractions:
            extractions.append(
                ExtractionFact(symptom="General clinical complaint", severity="mild", duration_days=1, additional_context=text)
            )

        # Missing info check for vague inputs
        if len(text.strip().split()) < 3 and not any(w in lower for w in ["severe", "emergency", "fever", "pain"]):
            has_missing_info = True
            missing_reason = "Patient input is very brief; duration or severity of symptoms is missing."
            follow_ups.append("How long have you had these symptoms and how severe are they (mild, moderate, or severe)?")

        return {
            "extractions": extractions,
            "confidence_score": 0.90 if extractions else 0.50,
            "has_contradiction": has_contradiction,
            "has_missing_info": has_missing_info,
            "missing_info_reason": missing_reason,
            "follow_up_questions": follow_ups
        }

    def _sanitize_extraction_payload(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures raw dict conforms to ExtractionFact structure and strips forbidden keys."""
        # Never allow urgency, department, rule_id from Gemini
        for forbidden in ["urgency", "department", "rule_id"]:
            raw.pop(forbidden, None)

        fact_objs = []
        for f in raw.get("extractions", []):
            fact_objs.append(
                ExtractionFact(
                    symptom=f.get("symptom", "Unspecified symptom"),
                    severity=f.get("severity"),
                    duration_days=f.get("duration_days"),
                    additional_context=f.get("additional_context")
                )
            )
        raw["extractions"] = fact_objs
        return raw

gemini_service = GeminiExtractionService()
