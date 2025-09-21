
// FIX: Import GenerateContentResponse to correctly type API call results.
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A wrapper function to retry an API call with exponential backoff.
 * @param apiCall The function to call.
 * @param maxRetries The maximum number of retries.
 * @param initialDelay The initial delay in milliseconds.
 * @returns The result of the API call.
 */
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await apiCall();
        } catch (error) {
            // Check for common transient error messages
            if (error instanceof Error && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded') || error.message.toLowerCase().includes('rate limit'))) {
                retries++;
                if (retries >= maxRetries) {
                    console.error("API call failed after multiple retries.", error);
                    throw error; // Rethrow after final attempt fails
                }
                // Exponential backoff with jitter to prevent thundering herd
                const delay = initialDelay * Math.pow(2, retries - 1) + Math.random() * 1000;
                console.log(`API is busy. Retrying in ${Math.round(delay)}ms... (Attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Rethrow other, non-transient errors immediately
                throw error;
            }
        }
    }
    // This line should be unreachable if maxRetries > 0, but it satisfies TypeScript's need for a return path.
    throw new Error("Exceeded max retries.");
};


const formatAnswersToPrompt = (answers: Record<string, any>): string => {
    return `
A user has provided the following information about themselves:
- **Country**: ${answers.country || 'Not specified'}
- **Enjoyed Subjects**: ${answers.subjects?.join(', ') || 'Not specified'}
- **Problem-Solving Style**: Prefers to solve problems ${answers.problem_solving_style?.join(', ') || 'Not specified'}
- **Preferred Work Focus**: Enjoys working with ${answers.work_focus?.join(', ') || 'Not specified'}
- **Comfort with Math**: ${answers.math_comfort || 'Not specified'}
- **Strongest Skills**: ${answers.strengths?.join(', ') || 'Not specified'}
- **Preferred Work Environment**: ${answers.environment?.join(', ') || 'Not specified'}
- **Preferred Organization Type**: ${answers.work_setting?.join(', ') || 'Not specified'}
- **Primary Motivation**: ${answers.motivation?.join(', ') || 'Not specified'}
- **Work Style**: Prefers working ${answers.work_style || 'Not specified'}
- **Interest in Tech**: ${answers.interest_in_tech || 'Not specified'}
- **Interest in Coding**: ${answers.interest_in_coding || 'Not specified'}
- **Prefers Physical Work**: ${answers.interest_in_physical_work || 'Not specified'}
- **Additional Experience/Info**: ${answers.additionalInfo || 'Not specified'}
`;
};

const createSystemInstruction = (duration: number): string => `
You are an expert AI Career & Skills Advisor.
Your mission is to guide students and early-career professionals toward fulfilling and suitable career options with clarity and motivation.

Task: Based on the user’s background, interests, skills, and prior experience (provided in the prompt), generate a personalized career guidance report. Crucially, consider the user's location (provided in the prompt) to suggest resources, job market trends, and educational paths that are relevant to their country.

Structure your response clearly into these exact sections using markdown for formatting (bolding, lists):
🎯 **Career Paths** → List at least 10 relevant career options, with 1-2 lines each on why they fit.
🛠 **Skills to Develop** → Suggest 8-10 crucial skills (a mix of technical, soft, and personal development areas) the user should focus on improving. For each skill, provide a brief (1-sentence) explanation of why it's important. Use a bulleted list.
🗣️ **Languages to Learn** → Suggest 2-3 programming languages or relevant human languages for the user to learn. Use a bulleted list.
📚 **Learning Resources** → Share 3 free or beginner-friendly resources (courses, YouTube, Google Cloud Skills Boost, etc.). Use a bulleted list.
🗺️ **Roadmap** → Create a precise and detailed ${duration}-year roadmap.
- For each year (e.g., **Year 1:**), break it into **Quarter 1–4** (e.g., **Q1:**, **Q2:**).
- In each quarter, suggest **specific learning topics, small projects, or activities** (e.g., "**Q1:** Learn Python basics → **Q2:** Build a calculator app → **Q3:** Join a coding challenge → **Q4:** Apply for internships").

Keep the language simple, encouraging, and highly structured with bullet points and emojis.
`;

const createSpecificJobSystemInstruction = (jobTitle: string, duration: number, hasExperience: boolean): string => `
You are an expert AI Career & Skills Advisor.
Your mission is to provide a detailed guide for a user who already knows their desired career path.

Task: Based on the user's desired career ("${jobTitle}")${hasExperience ? " and their provided experience" : ""}, generate a personalized career guidance report. Crucially, consider the user's location (provided in the prompt) to suggest resources, job market trends, and educational paths that are relevant to their country.

Structure your response clearly into these exact sections using markdown for formatting (bolding, lists):
🎯 **Career Paths** → Start with a 2-3 sentence overview of the user's chosen career: "${jobTitle}". Then, list 1-2 closely related alternative or specialized career paths.
🛠 **Skills to Develop** → Suggest the top 8-10 essential skills (a mix of technical, soft, and personal development areas) required for this role. For each skill, provide a brief (1-sentence) explanation of why it's important for the "${jobTitle}" career. Use a bulleted list.
🗣️ **Languages to Learn** → Suggest the most important programming languages, software, or relevant human languages to learn for this career. Use a bulleted list.
📚 **Learning Resources** → Share 3 free or beginner-friendly resources (courses, documentation, YouTube, etc.) to get started. Use a bulleted list.
🗺️ **Roadmap** → Create a precise and detailed ${duration}-year roadmap.
- For each year (e.g., **Year 1:**), break it into **Quarter 1–4** (e.g., **Q1:**, **Q2:**).
- In each quarter, suggest **specific learning topics, small projects, or activities** (e.g., "**Q1:** Learn Python basics → **Q2:** Build a calculator app → **Q3:** Join a coding challenge → **Q4:** Apply for internships").

Keep the language simple, encouraging, and highly structured with bullet points and emojis.
`;


export const generateCareerReport = async (answers: Record<string, any>, duration: number, regenerationContext?: string): Promise<string> => {
    try {
        let finalContent: string;
        let systemInstruction: string;
        
        if (answers.specificJob) {
             const hasExperience = !!answers.additionalInfo && answers.additionalInfo.trim() !== '';
             let experiencePrompt = '';
             if (hasExperience) {
                 experiencePrompt = ` They have also provided the following context about their experience: ${answers.additionalInfo}.`;
             }
             finalContent = `A user has a specific career in mind: "${answers.specificJob}". Their country is: ${answers.country || 'Not specified'}.${experiencePrompt}`;
             systemInstruction = createSpecificJobSystemInstruction(answers.specificJob, duration, hasExperience);
        } else {
             finalContent = regenerationContext ? `${regenerationContext}\n\nOriginal user profile:\n${formatAnswersToPrompt(answers)}` : formatAnswersToPrompt(answers);
             const systemInstructionForRegen = `You are an expert AI Career & Skills Advisor. A user has provided edits to a report you previously generated. Your task is to regenerate the *entire* report, treating the user's edits as the new source of truth for those sections. You must ensure the other, unedited sections are updated to be consistent with the user's changes. Maintain the original markdown structure and tone. The roadmap must be for a ${duration}-year duration.`;
             systemInstruction = regenerationContext ? systemInstructionForRegen : createSystemInstruction(duration);
        }

        // FIX: Explicitly type the response from the Gemini API call to resolve property access error.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalContent,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                topP: 0.95,
                topK: 64,
            },
        }));
        
        return response.text;
    } catch (error) {
        console.error("Error generating career report:", error);
        if (error instanceof Error) {
            if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded') || error.message.toLowerCase().includes('rate limit')) {
                return "🚧 The AI model is currently experiencing high demand. This is a temporary issue. Please wait a moment and try generating your report again.";
            }
            return `An error occurred while generating your report: ${error.message}. Please check the console for more details.`;
        }
        return "An unknown error occurred while generating your report.";
    }
};

const CHAT_SYSTEM_INSTRUCTION = `You are an expert, friendly, and encouraging AI assistant named 'Career Helper'. You are part of a larger career advisor application. Your primary role is to act as a supportive mentor for students and early-career professionals.

**Your Core Mission:**
- **Explain Concepts:** Clearly and simply explain career-related terms, technologies, skills, or job roles. Use analogies if they help.
- **Provide Actionable Advice:** Offer brief, practical advice on topics like resume building, interview preparation, networking, and skill development.
- **Maintain a Positive Tone:** Always be encouraging, positive, and motivating. Keep answers concise (2-5 sentences) and easy to digest.
- **Format for Readability:** Use plain text only. Do not use markdown.
- **Answer About Your Creators:** If asked who created you or this website, you should respond: "I was crafted with ❤️ by Team Epsilon to help you on your career journey!"

**Strict Boundaries (What you MUST NOT do):**
- **Do NOT generate career reports or roadmaps.** This is the main app's job. If asked for a full report, a list of careers, or a roadmap, you MUST politely decline and guide the user. For example: "I can't create a full report, but the app is perfect for that! Just answer the questions to get started, and you'll get a detailed report with career paths and a roadmap you can explore."
- **Do NOT generate code.** If a user asks for code, gently refuse and explain your purpose. For example: "I'm not equipped to write code, but I can explain what a specific programming language is used for in the industry!"
- **Do NOT answer questions outside of career/professional development.** If asked an off-topic question (like about your identity (other than your creators), personal opinions, or unrelated subjects), politely steer the conversation back. For example: "That's an interesting question! However, my expertise is focused on helping you with your career journey. Do you have any questions about preparing for interviews or perhaps what a 'Data Analyst' does?"
- **Do NOT provide financial, legal, or medical advice.**
- **Do NOT make up information.** If you don't know something, say so.`;

export class ChatService {
    private helperChat: Chat | null = null;

    constructor() {
        this.initHelperChat();
    }

    private initHelperChat() {
        this.helperChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: CHAT_SYSTEM_INSTRUCTION,
                temperature: 0.5,
            },
        });
    }

    public async sendMessageStream(message: string) {
        if (!this.helperChat) {
            this.initHelperChat();
        }
        // This is a type assertion because we know the init method sets the chat instance.
        return this.helperChat!.sendMessageStream({ message });
    }
}


export const generateDetailedRoadmap = async (
    originalAnswers: Record<string, any>,
    originalReport: string,
    selectedPath: string,
    duration: number
): Promise<string> => {
    try {
        const systemInstruction = `You are an expert AI Career Coach. A user has received a career report and has chosen to explore one specific career path in greater detail: "${selectedPath}".
Your task is to generate a comprehensive, multi-page roadmap document in markdown. The response must be ONLY the markdown content, with no conversational text before or after.
Tailor all recommendations, including resources, networking opportunities, and job market advice, to be highly relevant to the user's country and prior experience, which are specified in their original input.

The roadmap duration is ${duration} years.

**DOCUMENT STRUCTURE:**

1.  **Introduction:** Briefly re-introduce the "${selectedPath}" career path and why it's a great fit for the user based on their original input. Use one paragraph. **Immediately following this paragraph, you MUST include a list of the high-level themes for each year of the roadmap, which will be used to generate a diagram. Format it exactly like this, with the tags:**
    \`\`\`
    [ROADMAP_DIAGRAM_DATA]
    - Year 1: Building the Foundation
    - Year 2: Core Development Skills
    - Year 3: Specialization & Projects
    [/ROADMAP_DIAGRAM_DATA]
    \`\`\`
2.  **Year-by-Year Deep Dive:** For each year of the ${duration}-year roadmap, create a main heading (e.g., "## Year 1: Building the Foundation").
    *   **Quarterly Breakdown (Q1-Q4):** For each quarter, provide a sub-heading (e.g., "### Quarter 1: Mastering the Basics"). Then, provide a month-by-month plan within that quarter as a bulleted list.
    *   **Learning Objectives:** List specific technologies, concepts, or skills to master.
    *   **Project Ideas:** Suggest 1-2 small, practical projects for the quarter. Describe the project goal in 2-3 sentences. Use bolding for project titles.
    *   **Key Resources:** Recommend specific books, advanced online courses (e.g., on Coursera, edX), influential blogs, or documentation to read.
    *   **Networking:** Suggest specific online communities (Discord, Slack, Reddit), conferences, or types of local meetups to engage with.
3.  **Capstone Project Idea:** Under a main heading "## Capstone Project", propose a detailed, portfolio-worthy capstone project to be completed in the final year. Describe the project's features, the technologies to be used, and its potential impact.
4.  **Key Career Milestones:** Under a main heading "## Key Career Milestones", outline important milestones like "First Internship Application," "Contribute to Open Source," "Build Professional Portfolio," "First Full-Time Job Application."
5.  **Detailed Roadmap:** This section must be structured like a professional, line-by-line guide, drawing inspiration from the clear, sequential format of roadmap.sh. Do not create an ASCII diagram. The heading for this section must be "## Detailed Roadmap".
    *   **Structure:** Present the roadmap as a nested markdown list. Use headings for major milestones or technologies (e.g., "### Version Control Systems"). Under each heading, list specific items to learn or master.
    *   **Legend and Annotations:** You MUST include a legend at the top of this section and use the corresponding emoji annotations in the roadmap. The legend is:
        *   🟣 **Personal Recommendation:** A step or tool that is highly recommended for this path.
        *   ✅ **Alternative Option:** A viable alternative to a recommended step. The user can often choose one or the other.
        *   ⚫️ **Order Not Strict:** A skill or tool that can be learned at various points in the journey.
    *   **Content:** The content should be comprehensive, using knowledge from resources like roadmap.sh to list foundational knowledge, core technologies, advanced topics, and tools relevant to the "${selectedPath}" career path over the ${duration}-year duration. For each major topic, break it down into smaller, learnable chunks.
    *   **Example (for a Web Developer):**
        \`\`\`
        ### Version Control
        - 🟣 Learn Git basics (commit, push, pull, branch)
        - 🟣 Create a GitHub profile and host your projects

        ### Front-End Frameworks
        - 🟣 Learn React
        - ✅ Learn Vue.js
        - ✅ Learn Svelte
        \`\`\`
    *   **Conclusion:** After the roadmap, add a note mentioning that the user can find more visual and interactive roadmaps for many career paths at roadmap.sh.

**CONTEXT:**
- User's Original Input: "${formatAnswersToPrompt(originalAnswers)}"
- Original AI Report:
---
${originalReport}
---
`;

        // FIX: Explicitly type the response from the Gemini API call to resolve property access error.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate the detailed roadmap for the "${selectedPath}" career path, following all instructions.`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.6,
            }
        }));

        return response.text;
    } catch (error) {
        console.error("Error generating detailed roadmap:", error);
        if (error instanceof Error) {
            if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded') || error.message.toLowerCase().includes('rate limit')) {
                return "🚧 The AI model is currently experiencing high demand. This is a temporary issue. Please wait a moment and try generating your roadmap again.";
            }
            return `An error occurred while generating your roadmap: ${error.message}.`;
        }
        return "An unknown error occurred while generating your roadmap.";
    }
};