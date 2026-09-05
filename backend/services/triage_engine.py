import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from backend.schemas import TriageInput, TriageResult, ExtractionFact

CONFIDENCE_THRESHOLD = 0.70
RULES_FILE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "rules.json"


class TriageEngine:
    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = rules_path or RULES_FILE_PATH
        self.rules = self._load_rules()

    def _load_rules(self) -> List[Dict[str, Any]]:
        """Loads and validates clinical rules from JSON storage."""
        if not self.rules_path.exists():
            raise FileNotFoundError(f"Rules file not found at: {self.rules_path}")

        with open(self.rules_path, "r", encoding="utf-8") as f:
            rules = json.load(f)

        # Sort rules by priority descending, then rule_id ascending for deterministic execution order
        rules.sort(key=lambda r: (-r.get("priority", 0), r.get("rule_id", "")))
        return rules

    def evaluate(self, triage_input: TriageInput) -> TriageResult:
        """
        Evaluates structured patient information against deterministic clinical rules.
        Gemini is NEVER used here. Python decides all routing and escalation.
        """
        # 1. Uncertainty Check: Contradiction
        if triage_input.has_contradiction:
            return TriageResult(
                status="ESCALATED",
                reason="Contradictory patient clinical information detected during intake.",
                matched_facts=[]
            )

        # 2. Uncertainty Check: Missing critical information
        if triage_input.has_missing_info:
            missing_detail = triage_input.missing_info_reason or "Critical clinical details are missing or incomplete."
            return TriageResult(
                status="ESCALATED",
                reason=f"Insufficient information to make a safe triage determination: {missing_detail}",
                matched_facts=[]
            )

        # 3. Uncertainty Check: Confidence below safe threshold
        if triage_input.confidence_score < CONFIDENCE_THRESHOLD:
            return TriageResult(
                status="ESCALATED",
                reason=f"Extraction confidence score ({triage_input.confidence_score:.2f}) is below the required safety threshold ({CONFIDENCE_THRESHOLD:.2f}).",
                matched_facts=[]
            )

        # 4. Uncertainty Check: Empty extractions
        if not triage_input.extractions:
            return TriageResult(
                status="ESCALATED",
                reason="No clinical extractions or symptoms were provided for triage evaluation.",
                matched_facts=[]
            )

        # 5. Deterministic Rule Matching
        matching_results: List[Dict[str, Any]] = []

        for rule in self.rules:
            matched_facts = self._match_rule_conditions(rule, triage_input.extractions)
            if matched_facts:
                matching_results.append({
                    "rule": rule,
                    "matched_facts": matched_facts
                })

        # 6. Uncertainty Check: No safe rule matched
        if not matching_results:
            return TriageResult(
                status="ESCALATED",
                reason="No deterministic clinical rule matched the provided patient symptom profile.",
                matched_facts=[]
            )

        # 7. Priority Resolution: Highest priority rule wins (already pre-sorted by priority descending)
        selected_match = matching_results[0]
        selected_rule = selected_match["rule"]
        matched_facts_list = selected_match["matched_facts"]

        # Build exact, deterministic explanation
        rule_id = selected_rule["rule_id"]
        rule_name = selected_rule["name"]
        urgency = selected_rule["urgency"]
        department = selected_rule["department"]
        rule_reason = selected_rule.get("reason", "Rule criteria met.")

        facts_summary = ", ".join(
            [f"{fact.get('symptom', '')} (severity: {fact.get('severity', 'N/A')}, duration: {fact.get('duration_days', 'N/A')} days)"
             for fact in matched_facts_list]
        )

        traceable_reason = f"Rule [{rule_id} - {rule_name}] matched. Reason: {rule_reason} Matched Patient Facts: [{facts_summary}]."

        return TriageResult(
            status="ROUTED",
            urgency=urgency,
            department=department,
            rule_id=rule_id,
            rule_name=rule_name,
            reason=traceable_reason,
            matched_facts=matched_facts_list
        )

    def _match_rule_conditions(self, rule: Dict[str, Any], extractions: List[ExtractionFact]) -> List[Dict[str, Any]]:
        """
        Evaluates whether a given rule's conditions match any of the patient extractions.
        Returns a list of matched fact dicts if conditions pass, otherwise empty list.
        """
        conditions = rule.get("conditions", {})
        rule_symptoms = [s.lower() for s in conditions.get("symptoms", [])]
        severity_levels = [sev.lower() for sev in conditions.get("severity_levels", [])]
        min_duration = conditions.get("min_duration_days")
        max_duration = conditions.get("max_duration_days")

        matched_facts = []

        for fact in extractions:
            fact_symptom = fact.symptom.lower().strip()
            fact_severity = (fact.severity or "").lower().strip()
            fact_duration = fact.duration_days

            # Symptom match check (substring or exact)
            symptom_matched = any(rs in fact_symptom or fact_symptom in rs for rs in rule_symptoms)
            if not symptom_matched:
                continue

            # Severity check if specified by rule
            if severity_levels:
                severity_matched = any(sl in fact_severity or fact_severity in sl for sl in severity_levels)
                if not severity_matched:
                    continue

            # Duration min check
            if min_duration is not None:
                if fact_duration is None or fact_duration < min_duration:
                    continue

            # Duration max check
            if max_duration is not None:
                if fact_duration is None or fact_duration > max_duration:
                    continue

            # All required conditions for this rule matched this fact
            matched_facts.append({
                "symptom": fact.symptom,
                "severity": fact.severity,
                "duration_days": fact.duration_days,
                "additional_context": fact.additional_context
            })

        return matched_facts
