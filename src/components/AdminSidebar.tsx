import React from "react";
import { FaUsers, FaChartBar, FaFileAlt, FaFolderOpen } from "react-icons/fa";

interface AdminSidebarProps {
  activeTab: "users" | "sessions" | "stats" | "reports";
  setActiveTab: (tab: "users" | "sessions" | "stats" | "reports") => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const tabs = [
  { id: "users", label: "Users", icon: <FaUsers /> },
  { id: "sessions", label: "Sessions", icon: <FaFolderOpen /> },
  { id: "stats", label: "Stats", icon: <FaChartBar /> },
  { id: "reports", label: "Reports", icon: <FaFileAlt /> },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  toggleSidebar,
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1117] text-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static border-r border-gray-800`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow">
              <span className="font-bold text-white">AP</span>
            </div>
            <h2 className="text-lg font-semibold tracking-wide">Admin Panel</h2>
          </div>

          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={toggleSidebar}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (isOpen) toggleSidebar();
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all w-full
                  ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer (User info / profile) */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            {/* Replace with real admin avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-semibold">A</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium">Admin Name</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
