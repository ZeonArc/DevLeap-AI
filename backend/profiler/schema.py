from pydantic import BaseModel, Field
from typing import List, Optional

class Skill(BaseModel):
    name: str
    level: str = Field(description="e.g., Beginner, Intermediate, Advanced, Expert")
    context: str = Field(description="Context in which this skill was used in the repository")

class ArchitectureDiagram(BaseModel):
    title: str
    mermaid_code: str = Field(description="Mermaid.js syntax for the architecture diagram")
    description: str

class ProjectSummary(BaseModel):
    pitch: str = Field(description="A concise, non-technical summary of the repository's purpose and achievements")
    key_features: List[str]

class DeveloperProfile(BaseModel):
    skills: List[Skill]
    architecture_diagrams: List[ArchitectureDiagram]
    summary: ProjectSummary
