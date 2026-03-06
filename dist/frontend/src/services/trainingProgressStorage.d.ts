export type TrainingCompletionMap = Record<string, {
    completedAt: string;
}>;
export declare function loadTrainingCompletionMap(userId: number): Promise<TrainingCompletionMap>;
export declare function saveTrainingCompletionMap(userId: number, data: TrainingCompletionMap): Promise<void>;
export declare function setTrainingItemCompletion(userId: number, fileName: string, completed: boolean): Promise<TrainingCompletionMap>;
