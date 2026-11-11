import { LmsService } from './lms.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { CreateQuizDto, SubmitQuizDto } from './dto/quiz.dto';
import { AccessService, AuthUser } from '../../common/access/access.service';
export declare class LmsController {
    private readonly lmsService;
    private readonly access;
    constructor(lmsService: LmsService, access: AccessService);
    getLessons(groupId: string, user?: AuthUser): Promise<{
        quiz: {
            questions: {
                id: string;
                points: number;
                quizId: string;
                question: string;
                options: import("@prisma/client/runtime/library").JsonValue;
            }[];
            id: string;
            createdAt: Date;
            title: string;
            lessonId: string;
        };
        homeworks: {
            submissions: {
                student: {
                    id: string;
                    fullName: string;
                };
                id: string;
                status: import(".prisma/client").$Enums.SubmissionStatus;
                studentId: string;
                content: string;
                fileUrl: string | null;
                homeworkId: string;
                score: number | null;
                feedback: string | null;
                submittedAt: Date;
                reviewedAt: Date | null;
            }[];
            id: string;
            createdAt: Date;
            title: string;
            lessonId: string;
            description: string;
            deadline: Date | null;
            maxScore: number;
        }[];
        id: string;
        createdAt: Date;
        title: string;
        groupId: string;
        content: string | null;
        videoUrl: string | null;
        fileUrl: string | null;
        orderIndex: number;
        updatedAt: Date;
    }[]>;
    createLesson(dto: CreateLessonDto, user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        groupId: string;
        content: string | null;
        videoUrl: string | null;
        fileUrl: string | null;
        orderIndex: number;
        updatedAt: Date;
    }>;
    deleteLesson(id: string, user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        groupId: string;
        content: string | null;
        videoUrl: string | null;
        fileUrl: string | null;
        orderIndex: number;
        updatedAt: Date;
    }>;
    createHomework(dto: CreateHomeworkDto, user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        lessonId: string;
        description: string;
        deadline: Date | null;
        maxScore: number;
    }>;
    submitHomework(dto: SubmitHomeworkDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubmissionStatus;
        studentId: string;
        content: string;
        fileUrl: string | null;
        homeworkId: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date;
        reviewedAt: Date | null;
    }>;
    gradeSubmission(submissionId: string, dto: GradeSubmissionDto, user: AuthUser): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubmissionStatus;
        studentId: string;
        content: string;
        fileUrl: string | null;
        homeworkId: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date;
        reviewedAt: Date | null;
    }>;
    getSubmissions(homeworkId: string, user: AuthUser): Promise<({
        student: {
            id: string;
            phone: string;
            fullName: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubmissionStatus;
        studentId: string;
        content: string;
        fileUrl: string | null;
        homeworkId: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date;
        reviewedAt: Date | null;
    })[]>;
    createQuiz(dto: CreateQuizDto, user: AuthUser): Promise<{
        questions: {
            id: string;
            points: number;
            quizId: string;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctIndex: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        title: string;
        lessonId: string;
    }>;
    submitQuiz(dto: SubmitQuizDto): Promise<{
        lastScore: number;
        lastPassed: boolean;
        id: string;
        createdAt: Date;
        studentId: string;
        maxScore: number;
        score: number;
        quizId: string;
        passed: boolean;
    }>;
}
