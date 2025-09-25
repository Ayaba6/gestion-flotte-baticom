import React, { useState } from "react";

/**
 * Tabs component simple
 * Props:
 * - tabs: array d'objets { label: string, value: string, content: JSX.Element }
 */
export default function Tabs({ tabs, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  return (
    <div>
      {/* Boutons d'onglets */}
      <div className="flex gap-2 border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 font-medium rounded-t ${
              activeTab === tab.value
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu actif */}
      <div className="p-4 border rounded-b bg-white">
        {tabs.find((tab) => tab.value === activeTab)?.content}
      </div>
    </div>
  );
}
