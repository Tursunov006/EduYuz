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
            })[];
        } & {
            id: string;
            createdAt: Date;
            title: string;
            description: string;
            deadline: Date | null;
            maxScore: number;
            lessonId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        title: string;
        groupId: string;
        content: string | null;
        videoUrl: string | null;
        fileUrl: string | null;
        orderIndex: number;
        updatedAt: Date;
    })[]>;
    createLesson(dto: CreateLessonDto): Promise<{
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
    deleteLesson(id: string): Promise<{
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
    createHomework(dto: CreateHomeworkDto): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        deadline: Date | null;
        maxScore: number;
        lessonId: string;
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
    gradeSubmission(submissionId: string, dto: GradeSubmissionDto): Promise<{
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
    getSubmissionsByHomework(homeworkId: string): Promise<({
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
}
