"use client";

import { Bell, Search, LogOut, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          className="flex-1 text-sm outline-none text-gray-600 placeholder-gray-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-700">Admin</p>
            <p className="text-xs text-gray-400">Gerente</p>
          </div>
          <button className="ml-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
