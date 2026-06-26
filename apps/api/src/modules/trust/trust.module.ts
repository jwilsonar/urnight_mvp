import { Module } from '@nestjs/common';
import { CreateReportUseCase } from './application/use-cases/create-report.use-case';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { ListReviewsUseCase } from './application/use-cases/list-reviews.use-case';
import { ResolveReportUseCase } from './application/use-cases/resolve-report.use-case';
import { REPORT_REPOSITORY } from './domain/ports/report.repository';
import { ATTENDANCE_PORT, REVIEW_REPOSITORY } from './domain/ports/review.repository';
import { DrizzleAttendanceAdapter } from './infrastructure/persistence/drizzle-attendance.adapter';
import { DrizzleReportRepository } from './infrastructure/persistence/drizzle-report.repository';
import { DrizzleReviewRepository } from './infrastructure/persistence/drizzle-review.repository';
import { ReportsController } from './interfaces/http/reports.controller';
import { ReviewsController } from './interfaces/http/reviews.controller';

/** Bounded context Trust (Reviews & Reports) (§4.1). */
@Module({
  controllers: [ReviewsController, ReportsController],
  providers: [
    CreateReviewUseCase,
    ListReviewsUseCase,
    CreateReportUseCase,
    ResolveReportUseCase,
    { provide: REVIEW_REPOSITORY, useClass: DrizzleReviewRepository },
    { provide: REPORT_REPOSITORY, useClass: DrizzleReportRepository },
    { provide: ATTENDANCE_PORT, useClass: DrizzleAttendanceAdapter },
  ],
})
export class TrustModule {}
