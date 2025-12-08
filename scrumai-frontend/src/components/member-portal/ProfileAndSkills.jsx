import React, { useState, useEffect } from "react";

export default function ProfileAndSkills({ currentUser }) {
  const [skills, setSkills] = useState(currentUser?.skills || ["React", "Node.js"]);
  const [newSkill, setNewSkill] = useState("");
  const [areas, setAreas] = useState(
    currentUser?.preferredAreas || ["Frontend", "APIs"]
  );
  const [availability, setAvailability] = useState(
    currentUser?.availability || "Full-time (40h / week)"
  );

  useEffect(() => {
    if (currentUser) {
      setSkills(currentUser.skills || []);
      setAreas(currentUser.preferredAreas || []);
      setAvailability(currentUser.availability || "");
    }
  }, [currentUser]);

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const toggleArea = (area) => {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const areaOptions = [
    "Frontend",
    "Backend",
    "Full‑stack",
    "DevOps",
    "Testing / QA",
    "Data / ML",
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white border border-border rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-textPrimary mb-1">
          Profile & Skills
        </h2>
        <p className="text-sm text-textSecondary">
          This information helps ScrumAI suggest better assignments and keep your
          workload fair.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
        {/* Basic info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-textMuted mb-1">Name</p>
            <p className="text-sm font-medium text-textPrimary">
              {currentUser?.name || "Team Member"}
            </p>
          </div>
          <div>
            <p className="text-xs text-textMuted mb-1">Email</p>
            <p className="text-sm text-textSecondary">
              {currentUser?.email || "member@scrumai.com"}
            </p>
          </div>
        </div>

        {/* Skills list */}
        <div>
          <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
            Skills
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.length === 0 ? (
              <p className="text-xs text-textMuted">
                No skills added yet. Add a few key technologies and domains you
                are comfortable with.
              </p>
            ) : (
              skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="px-2 py-1 rounded-full bg-primary/5 text-primary text-xs border border-primary/20 flex items-center gap-1"
                >
                  <span>{skill}</span>
                  <span className="text-[11px] text-primary/70">×</span>
                </button>
              ))
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              className="px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Add a new skill (e.g. React, AWS, CI/CD)"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primaryDark transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Preferred areas */}
        <div>
          <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
            Preferred Work Areas
          </p>
          <p className="text-xs text-textMuted mb-2">
            ScrumAI can consider these preferences when auto‑assigning work.
          </p>
          <div className="flex flex-wrap gap-2">
            {areaOptions.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                  areas.includes(area)
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-textSecondary border-border hover:bg-surfaceLight"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
            Availability
          </p>
          <p className="text-xs text-textMuted mb-2">
            High‑level availability helps the system and your Scrum Master plan
            realistic load for you.
          </p>
          <textarea
            rows={3}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="e.g. Full‑time, 20h/week during exams, on leave next Thursday"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 text-xs text-textMuted">
        <p>
          In a full end‑to‑end version of ScrumAI these preferences would be
          stored in the backend and used by the{" "}
          <span className="font-semibold">AI auto‑assign</span> and{" "}
          <span className="font-semibold">capacity planning</span> logic. For
          your FYP, this screen clearly demonstrates that{" "}
          <span className="font-semibold">team members can control how the
          system understands their skills and availability</span>.
        </p>
      </div>
    </div>
  );
}












