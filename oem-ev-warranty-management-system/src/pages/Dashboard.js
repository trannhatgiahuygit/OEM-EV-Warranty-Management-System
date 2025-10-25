import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();
    const [role, setRole] = useState("SC_TECHNICIAN"); // đổi thành "EVM_STAFF" để test EVM menu

    const technicianMenu = [
        { title: "Customer", path: "/dashboard/customer" },
        { title: "Vehicle Management", path: "/dashboard/vehicle" },
        { title: "Technician Claim Management", path: "/dashboard/claim" },
        { title: "Part Serial Management", path: "/technician/part-management" },
    ];

    const evmMenu = [
        { title: "EVM Claim Management", path: "/dashboard/evm-claim" },
        { title: "EVM Part Inventory", path: "/evm/part-inventory" },
    ];

    const currentMenu = role === "SC_TECHNICIAN" ? technicianMenu : evmMenu;

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 text-white p-4">
                <h2 className="text-xl font-bold mb-4">Dashboard ({role})</h2>
                <ul>
                    {currentMenu.map((item) => (
                        <li
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="cursor-pointer hover:bg-gray-700 p-2 rounded mb-1"
                        >
                            {item.title}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-4">
                    Welcome, {role === "SC_TECHNICIAN" ? "Technician" : "EVM Staff"}!
                </h1>
                <p>Select a function from the menu to start working.</p>
            </div>
        </div>
    );
}
