import os
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Date, Text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from contextlib import asynccontextmanager

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# --------------------------------------------------
# SQLAlchemy setup
# --------------------------------------------------
engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# --------------------------------------------------
# Database Table Definition
# --------------------------------------------------
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(Date, index=True)
    time = Column(String(32))
    country = Column(String(128))
    flag = Column(String(32))
    event = Column(Text)
    category = Column(String(64))
    actual = Column(String(128), nullable=True)
    forecast = Column(String(128), nullable=True)
    prior = Column(String(128), nullable=True)

    # Extra columns for Earnings / Revenue / Dividends
    symbol = Column(String(64), nullable=True)
    estimate_eps = Column(String(64), nullable=True)
    actual_eps = Column(String(64), nullable=True)
    surprise = Column(String(64), nullable=True)
    market_cap = Column(String(64), nullable=True)
    dividend_amount = Column(String(64), nullable=True)
    dividend_yield = Column(String(64), nullable=True)
    revenue_estimate = Column(String(64), nullable=True)
    revenue_actual = Column(String(64), nullable=True)

# --------------------------------------------------
# Dummy seed data (optional)
# --------------------------------------------------
EVENTS_BY_DAY = {
    "2025-09-24": [
        {"time": "00:00", "country": "Canada", "flag": "🇨🇦", "event": "BoC Macklem Speech", "category": "Economic"},
        {"time": "00:30", "country": "Argentina", "flag": "🇦🇷", "event": "Retail Sales YoY", "category": "Economic", "actual": "19.6%", "prior": "27.8%"},
        {"time": "06:00", "country": "United States", "flag": "🇺🇸", "event": "Microsoft Earnings", "category": "Earnings",
         "symbol": "MSFT", "estimate_eps": "2.92", "actual_eps": "2.95", "surprise": "+1%", "market_cap": "2.4T USD"},
        {"time": "07:00", "country": "China", "flag": "🇨🇳", "event": "Alibaba Revenue Report", "category": "Revenue",
         "revenue_estimate": "¥210B", "revenue_actual": "¥215B"},
    ],
    "2025-09-25": [
        {"time": "07:00", "country": "Italy", "flag": "🇮🇹", "event": "Consumer Confidence Index", "category": "Economic", "actual": "98.2"},
        {"time": "07:30", "country": "United States", "flag": "🇺🇸", "event": "Apple Earnings", "category": "Earnings",
         "symbol": "AAPL", "estimate_eps": "1.39", "actual_eps": "1.42", "surprise": "+2%", "market_cap": "2.8T USD"},
        {"time": "08:00", "country": "United Kingdom", "flag": "🇬🇧", "event": "Shell Dividend", "category": "Dividends",
         "dividend_amount": "0.25 GBP", "dividend_yield": "3.5%"},
    ],
}

# --------------------------------------------------
# Database initialization and seeding
# --------------------------------------------------
def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Event).count() == 0:
            for day_iso, items in EVENTS_BY_DAY.items():
                day_date = datetime.strptime(day_iso, "%Y-%m-%d").date()
                for ev in items:
                    e = Event(
                        day=day_date,
                        time=ev.get("time"),
                        country=ev.get("country"),
                        flag=ev.get("flag"),
                        event=ev.get("event"),
                        category=ev.get("category"),
                        actual=ev.get("actual"),
                        forecast=ev.get("forecast"),
                        prior=ev.get("prior"),
                        symbol=ev.get("symbol"),
                        estimate_eps=ev.get("estimate_eps"),
                        actual_eps=ev.get("actual_eps"),
                        surprise=ev.get("surprise"),
                        market_cap=ev.get("market_cap"),
                        dividend_amount=ev.get("dividend_amount"),
                        dividend_yield=ev.get("dividend_yield"),
                        revenue_estimate=ev.get("revenue_estimate"),
                        revenue_actual=ev.get("revenue_actual"),
                    )
                    db.add(e)
            db.commit()
    finally:
        db.close()

# --------------------------------------------------
# FastAPI lifespan (Startup + Shutdown)
# --------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield
    # You can add cleanup here later

# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------
app = FastAPI(title="TradingView-style Economic Calendar API", lifespan=lifespan)

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://financial-calendar.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Database Dependency
# --------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# Utility: Convert Event → dict
# --------------------------------------------------
def event_to_dict(e: Event) -> Dict[str, Any]:
    return {
        "id": e.id,
        "day": e.day.isoformat(),
        "time": e.time,
        "country": e.country,
        "flag": e.flag,
        "event": e.event,
        "category": e.category,
        "actual": e.actual,
        "forecast": e.forecast,
        "prior": e.prior,
        "symbol": e.symbol,
        "estimate_eps": e.estimate_eps,
        "actual_eps": e.actual_eps,
        "surprise": e.surprise,
        "market_cap": e.market_cap,
        "dividend_amount": e.dividend_amount,
        "dividend_yield": e.dividend_yield,
        "revenue_estimate": e.revenue_estimate,
        "revenue_actual": e.revenue_actual,
    }

# ============================================================
# 🔹 CATEGORY-SPECIFIC EVENTS ENDPOINT
# ============================================================
@app.get("/events")
def get_events(
    day: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Event)
    if day:
        try:
            day_date = datetime.strptime(day, "%Y-%m-%d").date()
            q = q.filter(Event.day == day_date)
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD."}
    if category:
        q = q.filter(Event.category == category)

    rows = q.order_by(Event.time).all()

    if category == "Economic":
        data = [
            {
                "time": e.time,
                "flag": e.flag,
                "country": e.country,
                "event": e.event,
                "actual": e.actual,
                "forecast": e.forecast,
                "prior": e.prior,
            }
            for e in rows
        ]
        columns = ["Time", "Country", "Event", "Actual", "Forecast", "Prior"]

    elif category == "Earnings":
        data = [
            {
                "time": e.time,
                "symbol": e.symbol,
                "company": e.event,
                "estimate_eps": e.estimate_eps,
                "actual_eps": e.actual_eps,
                "surprise": e.surprise,
                "market_cap": e.market_cap,
            }
            for e in rows
        ]
        columns = ["Time", "Company", "Estimate EPS", "Actual EPS", "Surprise", "Market Cap"]

    elif category == "Dividends":
        data = [
            {
                "time": e.time,
                "company": e.event,
                "dividend_amount": e.dividend_amount,
                "dividend_yield": e.dividend_yield,
            }
            for e in rows
        ]
        columns = ["Time", "Company", "Amount", "Yield"]

    elif category == "Revenue":
        data = [
            {
                "time": e.time,
                "company": e.event,
                "revenue_estimate": e.revenue_estimate,
                "revenue_actual": e.revenue_actual,
            }
            for e in rows
        ]
        columns = ["Time", "Company", "Estimate Revenue", "Actual Revenue"]

    else:
        data = [event_to_dict(e) for e in rows]
        columns = list(data[0].keys()) if data else []

    return {"columns": columns, "data": data}

# ============================================================
# 🔹 WEEKLY SUMMARY ENDPOINTS
# ============================================================
@app.get("/week-summary")
def get_week_summary(
    start: str = Query(...),
    end: str = Query(...),
    db: Session = Depends(get_db),
):
    start_date = datetime.strptime(start, "%Y-%m-%d").date()
    end_date = datetime.strptime(end, "%Y-%m-%d").date()

    rows = db.query(Event).filter(Event.day >= start_date, Event.day <= end_date).all()
    summary = { (start_date + timedelta(days=i)).isoformat(): {} for i in range(7) }

    for ev in rows:
        iso = ev.day.isoformat()
        summary[iso][ev.category] = summary[iso].get(ev.category, 0) + 1

    return summary

@app.get("/summary")
def get_summary(week_start: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if week_start:
        start_date = datetime.strptime(week_start, "%Y-%m-%d").date()
    else:
        today = date.today()
        start_date = today - timedelta(days=today.weekday())
    end_date = start_date + timedelta(days=6)

    rows = db.query(Event).filter(Event.day >= start_date, Event.day <= end_date).all()

    days_map = {
        (start_date + timedelta(days=i)).isoformat(): {
            "iso": (start_date + timedelta(days=i)).isoformat(),
            "label": (start_date + timedelta(days=i)).strftime("%a %d"),
            "counts": {},
        }
        for i in range(7)
    }

    for ev in rows:
        iso = ev.day.isoformat()
        days_map[iso]["counts"].setdefault(ev.category, 0)
        days_map[iso]["counts"][ev.category] += 1

    days = [days_map[(start_date + timedelta(days=i)).isoformat()] for i in range(7)]
    return {"week_start": start_date.isoformat(), "week_end": end_date.isoformat(), "days": days}
