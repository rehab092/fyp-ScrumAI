import React from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function WorkloadCharts({ teamMembers, tasks }) {
  // Prepare data for workload bar chart
  const workloadData = teamMembers.map(member => ({
    name: member.name.split(" ")[0],
    assigned: member.assignedHours,
    capacity: member.capacityHours,
    percentage: Math.round((member.assignedHours / member.capacityHours) * 100)
  }));

  // Prepare data for role distribution pie chart
  const roleData = teamMembers.reduce((acc, member) => {
    const existing = acc.find(item => item.name === member.role);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: member.role, value: 1 });
    }
    return acc;
  }, []);

  // Prepare data for task status distribution
  const taskStatusData = [
    { name: "Assigned", value: tasks.filter(t => t.assignedTo).length },
    { name: "Unassigned", value: tasks.filter(t => !t.assignedTo).length }
  ];

  const COLORS = ['#319795', '#38B2AC', '#4A5568', '#718096', '#ED8936', '#EF4444'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg p-3 shadow-lg">
          <p className="text-textPrimary font-semibold">{payload[0].payload.name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-textSecondary">
              {entry.name}: {entry.value}{entry.name.includes("Hours") ? "h" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-textPrimary">Workload Analytics</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
          <p className="text-textMuted text-sm mb-1">Total Capacity</p>
          <p className="text-3xl font-bold text-textPrimary">
            {teamMembers.reduce((acc, m) => acc + m.capacityHours, 0)}h
          </p>
        </div>
        <div className="bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-6">
          <p className="text-textMuted text-sm mb-1">Total Assigned</p>
          <p className="text-3xl font-bold text-textPrimary">
            {teamMembers.reduce((acc, m) => acc + m.assignedHours, 0)}h
          </p>
        </div>
        <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6">
          <p className="text-textMuted text-sm mb-1">Available Capacity</p>
          <p className="text-3xl font-bold text-textPrimary">
            {teamMembers.reduce((acc, m) => acc + (m.capacityHours - m.assignedHours), 0)}h
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Bar Chart */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-textPrimary mb-4">Team Member Workload</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#4A5568" fontSize={12} />
              <YAxis stroke="#4A5568" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="assigned" fill="#319795" name="Assigned Hours" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" fill="#E2E8F0" name="Total Capacity" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution Pie Chart */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-textPrimary mb-4">Team by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-textPrimary mb-4">Task Assignment Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#38B2AC" />
                <Cell fill="#ED8936" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Capacity Utilization Table */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-textPrimary mb-4">Capacity Utilization</h3>
          <div className="space-y-3">
            {workloadData.map((member, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-textPrimary">{member.name}</span>
                  <span className={`font-bold ${
                    member.percentage >= 100 ? "text-error" :
                    member.percentage >= 80 ? "text-warning" :
                    "text-success"
                  }`}>
                    {member.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      member.percentage >= 100 ? "bg-error" :
                      member.percentage >= 80 ? "bg-warning" :
                      "bg-success"
                    }`}
                    style={{ width: `${Math.min(member.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}





