import json

from pydantic import BaseModel
from typing import List
import requests

from fastapi import FastAPI

import os
from dotenv import load_dotenv
load_dotenv()

import re
from pprint import pprint

def parse_planner_string(s):
    # Split by day markers (# or ,)
    day_strings = re.split(r'\s*#\s*|\s*,\s*', s)
    result = []

    for day_str in day_strings:
        # Extract day number
        day_match = re.search(r'day\s*(\d+)\s*:', day_str, re.IGNORECASE)
        if not day_match:
            continue
        day_number = int(day_match.group(1))

        # Extract all activities
        activity_pattern = r'\(time:\s*([^)]+)\)\(trip:\s*([^)]+)\)\(cost:\s*P?(\d+)\)'
        activities = []
        for m in re.finditer(activity_pattern, day_str, re.IGNORECASE):
            activities.append({
                "time": m.group(1).strip(),
                "trip": m.group(2).strip(),
                "cost": int(m.group(3))
            })

        result.append({
            "day": day_number,
            "activities": activities
        })

    return result
   
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

# Allow CORS for all domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allow all domains
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],       # Allow all headers
)

# REQ Interface
class ChatRequest(BaseModel):
    msg: str
    
# RES Interface
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

@app.post("/api/travelgenie", response_model=ChatResponse)
def agent(request: ChatRequest):
    url = os.getenv("MODEL_URL")
    payload = {
        "user": request.msg,
        "system": (
            "Agent: Help User plan their travel activities. "
            "Your responses should be in this example format (No added just the example): "
            "title: Tokyo 3-Day Adventure # recommendation: Best for first-time travelers exploring modern and traditional Japan. # totalCost: 54000 # "
            "{ 'data:' [{"
            "'day': 1,"
            "'activities': ["
                "{ 'time': '09:00', 'trip': 'Senso-ji Temple', 'cost': 0},"
                "{ 'time': '12:00', 'trip': 'Ueno Zoo', 'cost': 500},"
                "{ 'time': '18:00', 'trip': 'Akihabara Night Walk', 'cost': 0"
                "},"
            "],"
            "},"
            "{"
            "'day': 2,"
            "'activities': ["
                "{ 'time': '10:00', 'trip': 'Tokyo Skytree', 'cost': '2100' },"
                "{ 'time': '14:00', 'trip': 'Asakusa Food Tour', 'cost': '1500' },"
            "],"
            "}},]"
        )
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Extract the message string from the response
        # Depending on the remote API, it may be under "msg" or "text"
        msg_text = data.get("msg") or data.get("text") or str(data)

        # Parse fields from the returned string
        # Example expected format: "title: Basketball, date: 1, notes: , results: todo"
        import ast

        try:
            # Split msg_text into parts
            parts = [part.strip() for part in msg_text.split("#")]

            title = parts[0].split(":", 1)[1].strip()
            recommendation = parts[1].split(":", 1)[1].strip()
            totalCost = parts[2].split(":", 1)[1].strip()
            totalCost_num = totalCost.replace("P", "").strip()

            # Convert Python dict string to actual dict
            day = ast.literal_eval(parts[3].strip()) if len(parts) > 3 else {"data": []}

            msg = "success"
        except Exception as e:
            title = recommendation = "false"
            totalCost = totalCost_num = "0"
            day = {"data": []}
            msg = e + msg_text


        return {
            "msg": msg,
            "title": title,
            "recommendation": recommendation,
            "totalCost": int(totalCost_num),
            "days": day["data"]
        }

    except requests.RequestException as e:
        return {
            "msg": f"Error fetching data: {str(e)}",
            "title": "false",
            "recommendation": "false",
            "totalCost": 0,
            "days": []
        }
        
#run: uvicorn main:app --reload
