import React from 'react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { state } = useApp();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-blue-600">{state.sales.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Employees</h3>
          <p className="text-3xl font-bold text-green-600">{state.employees.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Debts</h3>
          <p className="text-3xl font-bold text-red-600">{state.debts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Checks</h3>
          <p className="text-3xl font-bold text-purple-600">{state.checks.length}</p>
        </div>
      </div>
    </div>
  );
}