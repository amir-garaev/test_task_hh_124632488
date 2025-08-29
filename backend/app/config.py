import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "postgres")

JWT_SECRET = os.getenv("JWT_SECRET","3gu05g0g3g35hg3503ghg33g53g53g53")
ACCESS_TTL_SECONDS = int(os.getenv("ACCESS_TTL_SECONDS","86400"))
