import React, { useState } from 'react';
import { LOGIN_ENDPOINTS, apiRequestFormData } from '../config/api';

export default function BacklogCreator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    owner_id: '',
    project_id: '',
    role: '',
    goal: '',
    benefit: '',
    priority: 'Medium',
    stories_text: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.owner_id || !formData.project_id || !formData.role || !formData.benefit || !formData.priority) {
        throw new Error('Owner ID, Project ID, Role, Benefit, and Priority are required.');
      }

      if (!formData.stories_text.trim()) {
        throw new Error('User story description is required.');
      }

      // Create FormData (backend expects POST data, not JSON)
      const data = new FormData();
      data.append('owner_id', formData.owner_id);
      data.append('project_id', formData.project_id);
      data.append('role', formData.role);
      data.append('goal', formData.goal);
      data.append('benefit', formData.benefit);
      data.append('priority', formData.priority);
      data.append('stories_text', formData.stories_text);

      // Call the API
      const response = await apiRequestFormData(LOGIN_ENDPOINTS.backlog.createFromStories, data);

      setSuccess(
        `Success! Created ${response.stories_created} user story and ${response.tasks_created} tasks.`
      );

      // Reset form
      setFormData({
        owner_id: '',
        project_id: '',
        role: '',
        goal: '',
        benefit: '',
        priority: 'Medium',
        stories_text: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to create backlog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-textPrimary mb-6">Create User Story & Backlog</h2>
        
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4 mb-6">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-6">
            <p className="text-success text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Owner ID <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary"
                placeholder="Enter owner ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Project ID <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary"
                placeholder="Enter project ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Role <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary"
                placeholder="e.g., user, admin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Priority <span className="text-error">*</span>
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Benefit <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.benefit}
                onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary"
                placeholder="e.g., improve user experience"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Goal (Optional)
              </label>
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary"
                placeholder="Enter goal"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textPrimary mb-2">
                User Story Description <span className="text-error">*</span>
              </label>
              <p className="text-xs text-textSecondary mb-2">
                Use the format: "As a [role], I want [goal], so that [benefit]"
              </p>
              <textarea
                required
                rows={6}
                value={formData.stories_text}
                onChange={(e) => setFormData({ ...formData, stories_text: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary font-mono text-sm"
                placeholder={`As a user, I want to login, so that I can access my account`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
              loading
                ? 'bg-textMuted text-background cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primaryDark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Processing...
              </div>
            ) : (
              'Create Backlog'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

