import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Edit3, Moon, Sun, Copy } from "lucide-react";

// Example prebuilt planners
const PREBUILT_PLANNERS = [
  {
    title: "Tokyo 3-Day Adventure",
    recommendation: "Best for first-time travelers exploring modern and traditional Japan.",
    totalCost: 54000,
    days: [
      {
        day: 1,
        activities: [
          { time: "09:00", trip: "Senso-ji Temple", cost: 0 },
          { time: "12:00", trip: "Ueno Zoo", cost: 500 },
          { time: "18:00", trip: "Akihabara Night Walk", cost: 0 },
        ],
      },
      {
        day: 2,
        activities: [
          { time: "10:00", trip: "Tokyo Skytree", cost: 2100 },
          { time: "14:00", trip: "Asakusa Food Tour", cost: 1500 },
        ],
      },
      {
        day: 3,
        activities: [
          { time: "11:00", trip: "Tsukiji Market", cost: 2000 },
          { time: "17:00", trip: "Tokyo Tower", cost: 1200 },
        ],
      },
    ],
  },
  {
    title: "Cebu 2-Day Island Escape",
    recommendation: "Perfect for sunny beaches and water adventures in the Philippines.",
    totalCost: 8200,
    days: [
      {
        day: 1,
        activities: [
          { time: "08:00", trip: "Oslob Whale Shark Watching", cost: 1200 },
          { time: "13:00", trip: "Tumalog Falls", cost: 200 },
          { time: "18:00", trip: "BBQ Dinner by the Beach", cost: 500 },
        ],
      },
      {
        day: 2,
        activities: [
          { time: "10:00", trip: "Sumilon Island Hop", cost: 3000 },
          { time: "15:00", trip: "Moalboal Sardine Run", cost: 1800 },
        ],
      },
    ],
  },
];

export default function TravelGenieMain() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [planners, setPlanners] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [modalPlannerIndex, setModalPlannerIndex] = useState(null);
  const [openPlanners, setOpenPlanners] = useState(
    planners.map(() => false)
  );

  function editPlanner(index) {
    const title = prompt("Edit Title", planners[index].title);
    if (title === null) return;

    const recommendation = prompt("Edit Recommendation", planners[index].recommendation);
    if (recommendation === null) return;

    const updated = [...planners];
    updated[index].title = title;
    updated[index].recommendation = recommendation;
    setPlanners(updated);
  }


  function togglePlanner(index) {
    setOpenPlanners(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  }

  useEffect(() => {
    localStorage.clear();
    const saved = localStorage.getItem("travelgenie_planners");
    if (saved) setPlanners(JSON.parse(saved));
    else setPlanners(PREBUILT_PLANNERS);
  }, []);

  useEffect(() => {
    localStorage.setItem("travelgenie_planners", JSON.stringify(planners));
  }, [planners]);

  async function sendMessage() {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    try {
      const response = await fetch("http://localhost:8000/api/travelgenie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg: input }),
      });
      const plannerJson = await response.json();
      if (plannerJson.msg !== "success") {
        setMessages((m) => [...m, { sender: "ai", text: plannerJson.msg }]);
        return;
      }
      alert(JSON.stringify(plannerJson));
      setPlanners((prev) => [...prev, plannerJson]);
      setMessages((m) => [
        ...m,
        { sender: "ai", text: "A new travel planner has been created!" },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { sender: "ai", text: "Server error. Try again." }]);
    }
    setInput("");
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  function deletePlanner(index) {
    if (window.confirm("Delete this planner?")) {
      setPlanners(planners.filter((_, i) => i !== index));
    }
  }

  function duplicatePlanner(index) {
    const clone = JSON.parse(JSON.stringify(planners[index]));
    clone.title += " (Copy)";
    setPlanners([...planners, clone]);
  }

  function exportPlanner(index) {
    const dataStr = JSON.stringify(planners[index], null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${planners[index].title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updatePlanner(index, updatedPlanner) {
    const newPlanners = [...planners];
    newPlanners[index] = updatedPlanner;
    setPlanners(newPlanners);
  }

  return (
    <div
      style={{
        width: "94vw",
        margin: "0 auto",
        padding: "2vw",
        minHeight: "100vh",
        background: darkMode
          ? "linear-gradient(180deg, #0d1117, #1a2332)"
          : "linear-gradient(180deg, #e8f1ff, #ffffff)",
        color: darkMode ? "#e4e9f0" : "#111",
        transition: "0.3s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 36, fontWeight: 900 }}>TravelGenie ✈️</h1>
        <button
          onClick={toggleDarkMode}
          style={{ background: "none", border: 0, cursor: "pointer", color: darkMode ? "#e4e9f0" : "#333" }}
        >
          {darkMode ? <Sun size={26} /> : <Moon size={26} />}
        </button>
      </div>

      {/* Chat Window */}
      <div
        style={{
          borderRadius: 10,
          padding: 12,
          marginBottom: 20,
          border: darkMode ? "1px solid #2c3a50" : "1px solid #d5d5d5",
          backgroundColor: darkMode ? "#1a2332" : "#ffffff",
          height: 260,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: m.sender === "user" ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              padding: 10,
              borderRadius: 8,
              maxWidth: "75%",
              marginBottom: 8,
              marginLeft: m.sender === "user" ? "auto" : 0,
              background: m.sender === "user" ? "#2979ff" : darkMode ? "#2e3b4c" : "#e9e9e9",
              color: m.sender === "user" ? "white" : darkMode ? "#d0dae6" : "#111",
            }}
          >
            {m.text}
          </motion.div>
        ))}
      </div>

      {/* Chat Input */}
      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell TravelGenie about your dream trip..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: darkMode ? "1px solid #2c3a50" : "1px solid #ccc",
            background: darkMode ? "#0f1724" : "#fff",
            color: darkMode ? "#e4e9f0" : "#111",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            background: "linear-gradient(90deg, #4b8bf4, #3066ff)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Send
        </button>
      </div>

      {/* Planner Section */}
      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Your Travel Planners</h2>

      {planners.map((planner, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            marginBottom: 22,
            padding: 18,
            borderRadius: 12,
            border: darkMode ? "1px solid #334155" : "1px solid #d7d7d7",
            background: darkMode ? "#111827" : "#ffffff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
          }}
        >
          {/* Title and actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => {
                const newOpen = [...openPlanners];
                newOpen[index] = !newOpen[index];
                setOpenPlanners(newOpen);
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                fontWeight: 800,
                cursor: "pointer",
                color: darkMode ? "#e4e9f0" : "#111"
              }}
            >
              {planner.title || `Trip #${index + 1}`} {openPlanners[index] ? "▲" : "▼"}
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => editPlanner(index)}
                style={{ background: "none", border: "none", cursor: "pointer", color: darkMode ? "#9dbbff" : "#333" }}
              >
                <Edit3 size={20} />
              </button>

              <button
                onClick={() => deletePlanner(index)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#d33" }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* Planner Details */}
          {openPlanners[index] && (
            <div style={{ marginTop: 12 }}>
              <p style={{ marginBottom: 12, opacity: 0.8 }}>{planner.recommendation}</p>

              {planner.days?.map((d, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: darkMode ? "#1f2a3a" : "#f5f5f5"
                  }}
                >
                  <h4 style={{ fontWeight: 700, marginBottom: 6 }}>Day {d.day}</h4>
                  <ul style={{ marginLeft: 16 }}>
                    {d.activities.map((a, idx) => (
                      <li key={idx}>
                        {a.time} — {a.trip} (₱{a.cost})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <p style={{ fontWeight: 700, marginTop: 10 }}>Total Cost: ₱{planner.totalCost}</p>
            </div>
          )}
        </motion.div>
      ))}

      {/* Modal Editor */}
      {modalPlannerIndex !== null && (
        <PlannerModal
          planner={planners[modalPlannerIndex]}
          onClose={() => setModalPlannerIndex(null)}
          onSave={(updated) => { updatePlanner(modalPlannerIndex, updated); setModalPlannerIndex(null); }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// Modal component for editing planner
function PlannerModal({ planner, onClose, onSave, darkMode }) {
  const [editedPlanner, setEditedPlanner] = useState(JSON.parse(JSON.stringify(planner)));

  function handleDayChange(dayIdx, key, value) {
    const newPlanner = { ...editedPlanner };
    newPlanner.days[dayIdx][key] = value;
    setEditedPlanner(newPlanner);
  }

  function handleActivityChange(dayIdx, actIdx, key, value) {
    const newPlanner = { ...editedPlanner };
    newPlanner.days[dayIdx].activities[actIdx][key] = value;
    setEditedPlanner(newPlanner);
  }

  function addDay() {
    const newPlanner = { ...editedPlanner };
    newPlanner.days.push({ day: newPlanner.days.length + 1, activities: [] });
    setEditedPlanner(newPlanner);
  }

  function removeDay(idx) {
    const newPlanner = { ...editedPlanner };
    newPlanner.days.splice(idx, 1);
    // Re-number days
    newPlanner.days.forEach((d, i) => d.day = i + 1);
    setEditedPlanner(newPlanner);
  }

  function addActivity(dayIdx) {
    const newPlanner = { ...editedPlanner };
    newPlanner.days[dayIdx].activities.push({ time: "09:00", trip: "", cost: 0 });
    setEditedPlanner(newPlanner);
  }

  function removeActivity(dayIdx, actIdx) {
    const newPlanner = { ...editedPlanner };
    newPlanner.days[dayIdx].activities.splice(actIdx, 1);
    setEditedPlanner(newPlanner);
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 999
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: "90%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto",
          background: darkMode ? "#111827" : "#fff", borderRadius: 12, padding: 24,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)", color: darkMode ? "#e4e9f0" : "#111"
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Edit Planner</h2>
        {/* Title & Recommendation */}
        <input
          value={editedPlanner.title}
          onChange={(e) => setEditedPlanner({ ...editedPlanner, title: e.target.value })}
          placeholder="Title"
          style={{ width: "100%", padding: 8, marginBottom: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <textarea
          value={editedPlanner.recommendation}
          onChange={(e) => setEditedPlanner({ ...editedPlanner, recommendation: e.target.value })}
          placeholder="Recommendation"
          style={{ width: "100%", padding: 8, marginBottom: 10, borderRadius: 6, border: "1px solid #ccc", resize: "vertical" }}
        />
        <input
          type="number"
          value={editedPlanner.totalCost}
          onChange={(e) => setEditedPlanner({ ...editedPlanner, totalCost: Number(e.target.value) })}
          placeholder="Total Cost"
          style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
        />

        {/* Days */}
        <h3 style={{ marginTop: 12 }}>Days</h3>
        {editedPlanner.days.map((d, dayIdx) => (
          <div key={dayIdx} style={{ border: "1px solid #ccc", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Day {d.day}</strong>
              <button onClick={() => removeDay(dayIdx)} style={{ color: "#d33", border: "none", background: "none", cursor: "pointer" }}>Remove Day</button>
            </div>
            {/* Activities */}
            {d.activities.map((a, actIdx) => (
              <div key={actIdx} style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <input type="time" value={a.time} onChange={e => handleActivityChange(dayIdx, actIdx, "time", e.target.value)} />
                <input type="text" value={a.trip} placeholder="Trip" onChange={e => handleActivityChange(dayIdx, actIdx, "trip", e.target.value)} />
                <input type="number" value={a.cost} placeholder="Cost" onChange={e => handleActivityChange(dayIdx, actIdx, "cost", Number(e.target.value))} />
                <button onClick={() => removeActivity(dayIdx, actIdx)} style={{ color: "#d33", border: "none", background: "none", cursor: "pointer" }}>Remove</button>
              </div>
            ))}
            <button onClick={() => addActivity(dayIdx)} style={{ marginTop: 6, padding: 4, borderRadius: 6, border: "none", backgroundColor: "#1e88e5", color: "#fff", cursor: "pointer" }}>+ Add Activity</button>
          </div>
        ))}
        <button onClick={addDay} style={{ padding: 6, borderRadius: 6, border: "none", backgroundColor: "#1e88e5", color: "#fff", cursor: "pointer", marginBottom: 12 }}>+ Add Day</button>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", background: "none", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave(editedPlanner)} style={{ padding: 8, borderRadius: 6, border: "none", backgroundColor: "#4b8bf4", color: "#fff", cursor: "pointer" }}>Save</button>
        </div>
      </motion.div>
    </div>
  );
}
