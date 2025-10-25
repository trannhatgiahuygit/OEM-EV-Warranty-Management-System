import React, { useState } from "react";

export default function SCPartManagementPage({ handleBackClick }) {
    const [vin, setVin] = useState("");
    const [parts, setParts] = useState([]);

    return (
        <div className="p-4">
            <button
                onClick={handleBackClick}
                className="bg-gray-500 text-white px-3 py-1 rounded mb-4"
            >
                ← Back
            </button>
            <h2 className="text-2xl font-bold mb-4">Part Serial Management (Technician)</h2>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Enter VIN"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    className="border rounded p-2 flex-1"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
            </div>

            {parts.length === 0 && (
                <p className="text-gray-500 italic">No parts loaded yet.</p>
            )}
        </div>
    );
}
