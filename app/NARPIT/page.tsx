"use client";

import { useState } from "react";

export default function WelcomePage() {
  const [competitionKey, setCompetitionKey] = useState("");
  const [teamNumber, setTeamNumber] = useState("");

  const checkConditions = () => {
    if (!competitionKey || !teamNumber) {
      alert("Please enter both Competition Key and Team Number.");
      return;
    }
    alert(`Competition Key: ${competitionKey}, Team Number: ${teamNumber}`);
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      <div
        id="title"
        className="text-5xl font-bold text-center py-8 border-b border-gray-300"
      >
        NARPIT
      </div>

      <div className="content flex flex-1">
        <div
          id="left"
          className="content-split w-1/2 flex flex-col justify-center items-center gap-8 p-8 border-r border-gray-300"
        >
          <div id="enter-key" className="stacked-content flex flex-col gap-2">
            <p className="text-lg font-medium">Enter Competition Key:</p>
            <input
              type="text"
              className="input-box border rounded px-3 py-2 w-64"
              id="competition-key"
              value={competitionKey}
              onChange={(e) => setCompetitionKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div
            id="enter-team-number"
            className="stacked-content flex flex-col gap-2"
          >
            <p className="text-lg font-medium">Enter Team Number:</p>
            <input
              type="text"
              className="input-box border rounded px-3 py-2 w-64"
              id="team-number"
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div
          id="right"
          className="content-split w-1/2 flex flex-col justify-center items-center gap-8 p-8"
        >
          <div className="flex-1 w-full flex flex-col justify-between"></div>
          <div id="embark-button" className="stacked-content">
            <button
              type="button"
              onClick={checkConditions}
              className="bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700 transition"
            >
              EMBARK!
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
