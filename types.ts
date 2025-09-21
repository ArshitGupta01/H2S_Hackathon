export interface HistoryItem {
    id: string;
    answers: Record<string, any>;
    summary: string;
    report: string;
    duration: number;
}

export interface ReportData {
    careerPaths: string;
    skillsToDevelop: string;
    languagesToLearn: string;
    learningResources: string;
    roadmap: string;
}
