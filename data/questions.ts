export type QuestionType = 'single-choice' | 'multiple-choice' | 'textarea';

export interface QuestionOption {
    value: string;
    label: string;
    icon?: string;
}

export interface Question {
    id: string;
    section: string;
    text: string;
    type: QuestionType;
    options: QuestionOption[];
    placeholder?: string;
    subtext?: string;
}

export const questions: Question[] = [
    {
        id: 'has_job_in_mind',
        section: 'Getting Started',
        text: 'Do you already have a specific career path in mind?',
        type: 'single-choice',
        options: [
            { value: 'Yes', label: 'Yes, I do', icon: '🎯' },
            { value: 'No', label: 'No, I need ideas', icon: '🤔' },
        ],
    },
    {
        id: 'subjects',
        section: 'Passion & Interests',
        text: 'Which school subjects or areas do you enjoy the most?',
        type: 'multiple-choice',
        options: [
            { value: 'Math & Logic', label: 'Math & Logic', icon: '🔢' },
            { value: 'Science & Experiments', label: 'Science & Experiments', icon: '🔬' },
            { value: 'Arts & Creativity', label: 'Arts & Creativity', icon: '🎨' },
            { value: 'Languages & Writing', label: 'Languages & Writing', icon: '✍️' },
            { value: 'History & Social Studies', label: 'History & Social Studies', icon: '🏛️' },
            { value: 'Technology & Computers', label: 'Technology & Computers', icon: '💻' },
        ],
    },
    {
        id: 'problem_solving_style',
        section: 'Passion & Interests',
        text: 'How do you prefer to solve problems? (Select all that apply)',
        type: 'multiple-choice',
        options: [
            { value: 'with logic and clear steps', label: 'Logically', icon: '🧠' },
            { value: 'by creating or designing new things', label: 'Creatively', icon: '💡' },
            { value: 'by collaborating and talking with others', label: 'Socially', icon: '💬' },
            { value: 'through hands-on experimentation', label: 'Experimentally', icon: '🧪' },
        ],
    },
    {
        id: 'work_focus',
        section: 'Passion & Interests',
        text: 'What would you rather work with? (Select all that apply)',
        type: 'multiple-choice',
        options: [
            { value: 'People', label: 'People', icon: '👥' },
            { value: 'Technology', label: 'Technology', icon: '🤖' },
            { value: 'Ideas & Data', label: 'Ideas & Data', icon: '📊' },
            { value: 'Nature & Animals', label: 'Nature/Animals', icon: '🌳'},
        ],
    },
    {
        id: 'math_comfort',
        section: 'Skills & Comfort',
        text: 'How comfortable are you with math and numbers?',
        type: 'single-choice',
        options: [
            { value: 'Not at all', label: 'Not at all', icon: '😟' },
            { value: 'A little', label: 'A little', icon: '🤔' },
            { value: 'Very', label: 'Very', icon: '😎' },
        ],
    },
    {
        id: 'strengths',
        section: 'Skills & Comfort',
        text: 'Which of these are your strongest skills?',
        type: 'multiple-choice',
        options: [
            { value: 'Communication', label: 'Communication', icon: '🗣️' },
            { value: 'Analysis', label: 'Analysis', icon: '🔍' },
            { value: 'Creativity', label: 'Creativity', icon: '✨' },
            { value: 'Leadership', label: 'Leadership', icon: '👑' },
            { value: 'Discipline', label: 'Discipline', icon: '💪' },
            { value: 'Empathy', label: 'Empathy', icon: '❤️‍🩹' },
        ],
    },
    {
        id: 'environment',
        section: 'Future Preferences',
        text: 'What kind of work environment do you prefer? (Select all that apply)',
        type: 'multiple-choice',
        options: [
            { value: 'A stable, predictable job', label: 'Stable & predictable', icon: '🏢' },
            { value: 'A fast-paced, ever-changing field', label: 'Fast-paced & dynamic', icon: '🚀' },
            { value: 'Working independently from anywhere', label: 'Flexible & remote', icon: '🌍' },
            { value: 'An outdoor or hands-on setting', label: 'Outdoor / On-site', icon: '🏞️' },
        ],
    },
    {
        id: 'work_setting',
        section: 'Future Preferences',
        text: 'What type of organization would you prefer to work in?',
        type: 'multiple-choice',
        options: [
            { value: 'Corporate', label: 'Corporate', icon: '🏢' },
            { value: 'Startup', label: 'Startup', icon: '🚀' },
            { value: 'Government', label: 'Government', icon: '🏛️' },
            { value: 'Self-employment / Freelance', label: 'Self-employed', icon: '👤' },
        ],
    },
    {
        id: 'motivation',
        section: 'Future Preferences',
        text: 'What is your primary career motivation? (Select all that apply)',
        type: 'multiple-choice',
        options: [
            { value: 'a high salary and fast growth', label: 'High Salary', icon: '💰' },
            { value: 'passion and personal fulfillment', label: 'Passion', icon: '❤️' },
            { value: 'making a positive impact on the world', label: 'Impact', icon: '🌟' },
            { value: 'work-life balance', label: 'Work-Life Balance', icon: '⚖️' },
            { value: 'job security', label: 'Job Security', icon: '🔒' },
            { value: 'innovation and cutting-edge work', label: 'Innovation', icon: '🚀' },
        ],
    },
    {
        id: 'work_style',
        section: 'Personality',
        text: 'Do you prefer working in a team or individually?',
        type: 'single-choice',
        options: [
            { value: 'in a team', label: 'In a team', icon: '👨‍👩‍👧‍👦' },
            { value: 'individually', label: 'Individually', icon: '👤' },
            { value: 'a mix of both', label: 'A mix of both', icon: '🤝' },
        ],
    },
    {
        id: 'interest_in_tech',
        section: 'Interests Check',
        text: 'Are you generally interested in technology?',
        type: 'single-choice',
        options: [{ value: 'Yes', label: 'Yes', icon: '👍' }, { value: 'No', label: 'No', icon: '👎' }],
    },
    {
        id: 'interest_in_coding',
        section: 'Interests Check',
        text: 'Does the idea of coding or programming appeal to you?',
        type: 'single-choice',
        options: [{ value: 'Yes', label: 'Yes', icon: '👍' }, { value: 'No', label: 'No', icon: '👎' }],
    },
    {
        id: 'interest_in_physical_work',
        section: 'Interests Check',
        text: 'Do you prefer hands-on, physical work over desk work?',
        type: 'single-choice',
        options: [{ value: 'Yes', label: 'Yes', icon: '👍' }, { value: 'No', label: 'No', icon: '👎' }],
    },
    {
        id: 'additionalInfo',
        section: 'Experience',
        text: 'Do you have any prior experience? (Optional)',
        type: 'textarea',
        options: [],
        subtext: 'Mention any internships, projects, or relevant work experience. This helps the AI create a more tailored report.',
        placeholder: 'e.g., "interned as.....", "built something....", "used to host, speak on......."'
    }
];