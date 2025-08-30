# Flask Extensions - Single Source of Truth
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Single SQLAlchemy instance - imported everywhere
db = SQLAlchemy(model_class=Base)