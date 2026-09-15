from typing import List, Optional

def calculate_evidence_quality_score(
    gps_accuracy: Optional[float],
    has_photo_evidence: bool,
    has_voice_transcript: bool,
    has_trip_context: bool,
    is_duplicate_correlated: bool = False,
) -> float:
    """
    Computes a non-AI evidence quality score (0 to 100) reflecting data reliability.
    """
    score = 0.0

    # 1. GPS Precision (up to 30 pts)
    if gps_accuracy is not None:
        if gps_accuracy <= 10.0:
            score += 30.0
        elif gps_accuracy <= 25.0:
            score += 20.0
        elif gps_accuracy <= 50.0:
            score += 10.0
        else:
            score += 5.0
    else:
        score += 15.0

    # 2. Visual Evidence (up to 30 pts)
    if has_photo_evidence:
        score += 30.0

    # 3. Audio / Voice Narrative (up to 15 pts)
    if has_voice_transcript:
        score += 15.0

    # 4. Verified Driver & Active Transit Manifest (up to 15 pts)
    if has_trip_context:
        score += 15.0

    # 5. Multi-Source Ground Truth Correlation (up to 10 pts)
    if is_duplicate_correlated:
        score += 10.0

    return min(100.0, round(score, 1))
