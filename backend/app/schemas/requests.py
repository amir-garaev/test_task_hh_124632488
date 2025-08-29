from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class ResumeBase(BaseModel):
    title: str
    content: str

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(ResumeBase):
    pass
