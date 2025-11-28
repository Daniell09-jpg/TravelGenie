import json
import re
import ast
import os
import requests
from pprint import pprint
from typing import List
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


load_dotenv()

# -----------------------------
# Pydantic Models
# -----------------------------
class ChatRequest(BaseModel):
    msg: str


class Activity(BaseModel):
    time: str
    trip: str
    cost: int


class Day(BaseModel):
    day: int
    activities: List[Activity]


class ChatResponse(BaseModel):
    msg: str
    title: str
    recommendation: str
    totalCost: int
    days: List[Day]


# -----------------------------
# App Initialization
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Helpers
# -----------------------------
def safe_int(value):
    """Converts string cost (possibly with 'P' or spaces) to int safely."""
    try:
        return int(str(value).replace("P", "").strip())
    except:
        return 0


def parse_agent_response(msg_text: str):
    """
    Expected AI format:

    title: X # recommendation: Y # totalCost: 123 # {'data': [{...}]}
    """

    # Split using '#'
    parts = [p.strip() for p in msg_text.split("#")]

    # Base defaults
    title = "false"
    recommendation = "false"
    totalCost_num = 0
    parsed_days = []

    try:
        # --- TITLE ---
        if "title:" in parts[0]:
            title = parts[0].split(":", 1)[1].strip()

        # --- RECOMMENDATION ---
        if len(parts) > 1 and "recommendation:" in parts[1]:
            recommendation = parts[1].split(":", 1)[1].strip()

        # --- TOTAL COST ---
        if len(parts) > 2 and "totalCost:" in parts[2]:
            totalCost = parts[2].split(":", 1)[1].strip()
            totalCost_num = safe_int(totalCost)

        # --- DAYS DATA ---
        if len(parts) > 3:
            raw_days = parts[3]

            # Convert Python-like dict string into real dict
            days_dict = ast.literal_eval(raw_days)
            parsed_days = days_dict.get("data", [])

    except Exception as e:
        print("❌ PARSE ERROR:", e)
        return dict(
            msg=msg_text,
            title="false",
            recommendation="false",
            totalCost=0,
            days=[]
        )

    # SUCCESS
    return dict(
        msg="success",
        title=title,
        recommendation=recommendation,
        totalCost=totalCost_num,
        days=parsed_days
    )


# -----------------------------
# Main API
# -----------------------------
@app.post("/api/travelgenie", response_model=ChatResponse)
def agent(request: ChatRequest):

    url = os.getenv("MODEL_URL")

    system_prompt = (
        "Agent: Help User plan their travel activities. "
        "Your responses should be in this exact format (NO EXTRA TEXT): "
        "title: Tokyo Trip # recommendation: Best for travelers # totalCost: 3000 # "
        "{'data': ["
        "{'day': 1, 'activities': [ {'time': '09:00','trip': 'Temple','cost': 200} ]},"
        "{'day': 2, 'activities': [ {'time': '10:00','trip': 'Skytree','cost': 2100} ]}"
        "]}"
    )

    payload = {
        "user": request.msg,
        "system": system_prompt
    }

    try:
        # Send request to model
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()
        msg_text = data.get("msg") or data.get("text") or str(data)

        # Parse AI response safely
        parsed = parse_agent_response(msg_text)

        return parsed

    except requests.RequestException as e:
        return {
            "msg": f"Error: {str(e)}",
            "title": "false",
            "recommendation": "false",
            "totalCost": 0,
            "days": [],
        }
