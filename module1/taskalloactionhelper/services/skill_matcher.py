"""
Smart Skill Matching Engine
Matches task requirements to developer skills intelligently.
Understands skill hierarchies and relationships, not just keywords.
"""
import json
from typing import Dict, List, Tuple


class SkillMatcher:
    """
    Intelligent skill matching system.
    Understands skill hierarchies and relationships.
    """
    
    # Skill Relationships - maps skill groups to related skills
    SKILL_RELATIONSHIPS = {
        'MERN': ['MongoDB', 'Express', 'React', 'Node.js', 'JavaScript', 'REST API', 'JSON'],
        'MEAN': ['MongoDB', 'Express', 'Angular', 'Node.js', 'JavaScript', 'TypeScript'],
        'LAMP': ['Linux', 'Apache', 'MySQL', 'PHP'],
        'React': ['JavaScript', 'JSX', 'Component Design', 'State Management', 'Hooks', 'Redux', 'CSS'],
        'React Native': ['JavaScript', 'React', 'Mobile Development', 'iOS', 'Android'],
        'Node.js': ['JavaScript', 'Express', 'REST API', 'Backend', 'npm', 'Async'],
        'Python': ['Django', 'Flask', 'FastAPI', 'Data Science', 'Pandas', 'NumPy'],
        'Django': ['Python', 'REST Framework', 'ORM', 'Backend', 'PostgreSQL'],
        'Flask': ['Python', 'REST API', 'Backend', 'Jinja2'],
        'PostgreSQL': ['SQL', 'Database', 'Relational DB', 'Queries', 'Indexes'],
        'MongoDB': ['NoSQL', 'JSON', 'Database', 'BSON', 'Collections'],
        'MySQL': ['SQL', 'Database', 'Relational DB', 'Queries'],
        'REST API': ['HTTP', 'API Design', 'JSON', 'endpoints', 'CRUD'],
        'GraphQL': ['API Design', 'Queries', 'Mutations', 'Schema', 'Client'],
        'Docker': ['Containerization', 'DevOps', 'Images', 'Compose'],
        'Kubernetes': ['Orchestration', 'DevOps', 'Containers', 'Deployment'],
        'AWS': ['Cloud', 'DevOps', 'EC2', 'S3', 'Lambda', 'RDS'],
        'GCP': ['Cloud', 'DevOps', 'Compute', 'Storage', 'BigQuery'],
        'Jest': ['Testing', 'Unit Testing', 'JavaScript', 'Mocking'],
        'Pytest': ['Testing', 'Unit Testing', 'Python', 'Fixtures'],
        'Git': ['Version Control', 'GitHub', 'GitLab', 'Branching', 'Merging'],
        'TypeScript': ['JavaScript', 'Type Safety', 'OOP', 'Interfaces'],
        'Vue.js': ['JavaScript', 'Frontend', 'Component Design', 'State Management'],
        'Angular': ['TypeScript', 'Frontend', 'Component Design', 'RxJS'],
        'Linux': ['Operating System', 'Command Line', 'DevOps', 'Bash'],
        'Frontend': ['HTML', 'CSS', 'JavaScript', 'UI/UX', 'Responsive Design'],
        'Backend': ['API Design', 'Database', 'Authentication', 'Server'],
        'Full Stack': ['Frontend', 'Backend', 'Database', 'DevOps'],
    }
    
    def match_task_to_developer(self, task, developer):
        """
        Compare task skills to developer skills.
        Returns comprehensive match analysis.
        
        Args:
            task: Backlog object with skills_required field
            developer: TeamMember object with skills field
            
        Returns:
            Dict with overall_score (0-100) and detailed breakdown
        """
        task_skills = self._parse_skills(task.skills_required)
        dev_skills = self._parse_skills(developer.skills)
        
        exact_matches = 0
        related_matches = 0
        missing_required = 0
        skill_breakdown = {}
        
        for required_skill in task_skills:
            match_score = self._score_skill_match(required_skill, dev_skills)
            is_required = True  # Assume all are required unless marked optional
            
            if match_score == 100:
                exact_matches += 1
            elif match_score >= 70:
                related_matches += 1
            elif is_required:
                missing_required += 1
            
            skill_breakdown[required_skill] = {
                'required': is_required,
                'score': match_score,
                'match_type': self._classify_match(match_score),
                'developer_alternatives': self._find_alternatives(required_skill, dev_skills)
            }
        
        overall_score = self._calculate_overall_score(
            exact_matches, related_matches, missing_required, len(task_skills)
        )
        
        return {
            'overall_score': round(overall_score, 2),
            'exact_matches': exact_matches,
            'related_matches': related_matches,
            'missing_required': missing_required,
            'total_required': len(task_skills),
            'skill_breakdown': skill_breakdown,
            'is_viable': overall_score >= 50,  # Minimum viability threshold
        }
    
    def _parse_skills(self, skills_input):
        """
        Parse skills from various formats: JSON, comma-separated, list, string.
        Returns normalized list of skills.
        """
        if isinstance(skills_input, list):
            return skills_input
        
        if isinstance(skills_input, str):
            try:
                # Try JSON parsing
                parsed = json.loads(skills_input)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            
            # Try comma-separated
            if ',' in skills_input:
                return [s.strip() for s in skills_input.split(',')]
            
            # Single skill
            return [skills_input.strip()]
        
        if isinstance(skills_input, dict):
            # If dict, extract keys
            return list(skills_input.keys())
        
        return []
    
    def _score_skill_match(self, required_skill, dev_skills):
        """
        Score how well developer's skills match required skill.
        
        Returns:
            100 - Exact match
            80-90 - Strong related skill
            50-70 - Related/tangential skill
            0 - No match
        """
        required_lower = required_skill.lower().strip()
        dev_skills_lower = [s.lower().strip() for s in dev_skills]
        
        # Check for exact match
        if required_lower in dev_skills_lower:
            return 100
        
        # Check skill relationships
        for skill_group, related_skills in self.SKILL_RELATIONSHIPS.items():
            skill_group_lower = skill_group.lower()
            related_lower = [s.lower() for s in related_skills]
            
            # Case 1: Required skill is part of a skill group (e.g., React in MERN)
            if required_lower in related_lower:
                # Check if developer has other skills from same group
                group_matches = sum(1 for s in related_skills 
                                  if s.lower() in dev_skills_lower)
                
                if group_matches > 0:
                    # Developer has related skills from this group
                    return 85  # Strong match
            
            # Case 2: Required skill IS a skill group (e.g., MERN)
            if required_lower == skill_group_lower:
                # Count how many skills from group developer has
                group_members = [s.lower() for s in related_skills]
                matches = sum(1 for dev_skill in dev_skills_lower 
                            if dev_skill in group_members)
                
                if matches > 0:
                    # Coverage percentage of the group
                    coverage = (matches / len(related_skills)) * 100
                    
                    if coverage >= 70:  # Has most of the group
                        return 90
                    elif coverage >= 40:  # Has some of the group
                        return 75
                    else:  # Has few skills from group
                        return 55
        
        # Check for partial keyword match (last resort)
        for dev_skill in dev_skills_lower:
            if required_lower in dev_skill or dev_skill in required_lower:
                return 50
        
        return 0
    
    def _find_alternatives(self, required_skill, dev_skills):
        """Find similar skills developer has that might satisfy the requirement."""
        alternatives = []
        required_lower = required_skill.lower().strip()
        
        for skill_group, related_skills in self.SKILL_RELATIONSHIPS.items():
            related_lower = [s.lower() for s in related_skills]
            
            if required_lower in related_lower:
                # Find developer's related skills
                for dev_skill in dev_skills:
                    if dev_skill.lower() in related_lower:
                        alternatives.append(dev_skill)
        
        return list(set(alternatives))[:3]  # Return top 3 unique alternatives
    
    def _calculate_overall_score(self, exact, related, missing, total):
        """
        Calculate overall skill match score.
        
        Formula: 
        - Exact matches: +100 points each
        - Related matches: +70 points each
        - Missing required: -20 points each
        - Divide by total requirements
        
        Result: 0-100 scale
        """
        if total == 0:
            return 50  # Neutral score if no skills required
        
        if missing > 0:
            penalty = missing * 20
        else:
            penalty = 0
        
        raw_score = ((exact * 100 + related * 70) / total) - penalty
        
        # Cap between 0 and 100
        return max(0, min(100, raw_score))
    
    def _classify_match(self, score):
        """Classify match type based on score."""
        if score >= 100:
            return 'exact'
        elif score >= 80:
            return 'strong'
        elif score >= 60:
            return 'related'
        elif score >= 40:
            return 'partial'
        else:
            return 'weak'
    
    def rank_developers_for_task(self, task, developers):
        """
        Rank all developers for a single task based on skill match only.
        
        Returns:
            List of developers sorted by skill match score (highest first)
        """
        rankings = []
        
        for dev in developers:
            match = self.match_task_to_developer(task, dev)
            rankings.append({
                'developer': dev,
                'skill_match_score': match['overall_score'],
                'skill_details': match['skill_breakdown'],
                'is_viable': match['is_viable']
            })
        
        # Sort by skill score
        rankings.sort(key=lambda x: x['skill_match_score'], reverse=True)
        
        return rankings
    
    def get_skill_match_summary(self, task, developer):
        """Get a human-readable summary of skill matching."""
        match = self.match_task_to_developer(task, developer)
        
        summary = f"Skill Match: {match['overall_score']}%\n"
        summary += f"Exact Matches: {match['exact_matches']}/{match['total_required']}\n"
        summary += f"Related Matches: {match['related_matches']}/{match['total_required']}\n"
        
        if match['missing_required'] > 0:
            summary += f"Missing Skills: {match['missing_required']}\n"
            missing_skills = [skill for skill, details in match['skill_breakdown'].items() 
                            if details['score'] == 0]
            summary += f"  - {', '.join(missing_skills)}\n"
        
        summary += f"Viability: {'✓ Viable' if match['is_viable'] else '✗ Not Viable'}"
        
        return summary
    
    def _score_skill_match_comprehensive(self, required_skills, dev_skills):
        """
        Score skill match between required skills (list) and developer skills (list).
        
        Smart matching algorithm:
        - Exact matches = 100 points
        - Related skill matches (e.g., MERN includes React) = 80-90 points  
        - Partial matches = 50 points
        - No match = 0 points
        
        Returns:
            Overall skill match score 0-100
        """
        if not required_skills:
            return 100  # No skills required
        
        if not dev_skills:
            return 0  # Developer has no skills
        
        total_score = 0
        matches_found = 0
        
        for required in required_skills:
            score = self._score_skill_match(required, dev_skills)
            total_score += score
            
            if score > 0:
                matches_found += 1
        
        # Calculate overall percentage
        overall = (total_score / (len(required_skills) * 100)) * 100
        
        return round(overall, 1)
