from pydantic import BaseModel


class ResumeParseRequest(BaseModel):
    text: str


class MatchRequest(BaseModel):
    job_id: str
    resume_text: str


class SkillEvidence(BaseModel):
    skill: str
    evidence: list[str]
