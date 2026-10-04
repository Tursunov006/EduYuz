import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
export declare class LmsService {
    private prisma;
    constructor(prisma: PrismaService);
    getLessonsByGroup(groupId: string): Promise<({
        homeworks: ({
            submissions: ({
                student: {
                    id: string;
                    fullName: string;
                    phone: string;
                };
            } & {
                id: string;
                content: string;
                fileUrl: string | null;
                status: import(".prisma/client").$Enums.SubmissionStatus;
                homeworkId: string;
                studentId: string;
                score: number | null;
                feedback: string | null;
                submittedAt: Date;
                reviewedAt: Date | null;
            })[];
        } & {
            id: string;
            title: string;
            createdAt: Date;
            lessonId: string;
            description: string;
            deadline: Date | null;
            maxScore: number;
        })[];
    } & {
        id: string;
        groupId: string;
        title: string;
        content: string | null;
        videoUrl: string | null;
        fileUrl: string | null;
        orderIndex: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    createLesson(dto: CreateLessonDto): Promise<{
        id: string;
        groupId: string;
        title: string;
        content: string | null;
        videoUrl: string | null;
        fileUrl: string | null;
        orderIndex: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteLesson(id: string): Promise<{
        id: string;
        groupId: string;
        title: string;
        content: string | null;
        videoUrl: string | null;
        fileUrl: string | null;
        orderIndex: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createHomework(dto: CreateHomeworkDto): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        lessonId: string;
        description: string;
        deadline: Date | null;
        maxScore: number;
    }>;
    submitHomework(dto: SubmitHomeworkDto): Promise<{
        id: string;
        content: string;
        fileUrl: string | null;
        status: import(".prisma/client").$Enums.SubmissionStatus;
        homeworkId: string;
        studentId: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date;
        reviewedAt: Date | null;
    }>;
    gradeSubmission(submissionId: string, dto: GradeSubmissionDto): Promise<{
        id: string;
        content: string;
        fileUrl: string | null;
        status: import(".prisma/client").$Enums.SubmissionStatus;
        homeworkId: string;
        studentId: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date;
        reviewedAt: Date | null;
    }>;
    getSubmissionsByHomework(homeworkId: string): Promise<({
        student: {
            id: string;
            fullName: string;
            phone: string;
        };
    } & {
        id: string;
        content: string;
        fileUrl: string | null;
        status: import(".prisma/client").$Enums.SubmissionStatus;
        homeworkId: string;
        studentId: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date;
        reviewedAt: Date | null;
    })[]>;
    createQuiz(lessonId: string, title: string, questions: any[]): Promise<{
        questions: {
            id: string;
            points: number;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctIndex: number;
            quizId: string;
        }[];
    } & {
        id: string;
        title: string;
        createdAt: Date;
        lessonId: string;
    }>;
    submitQuiz(quizId: string, studentId: string, answers: number[]): Promise<{
        id: string;
        createdAt: Date;
        maxScore: number;
        studentId: string;
        score: number;
        quizId: string;
        passed: boolean;
    }>;
}
