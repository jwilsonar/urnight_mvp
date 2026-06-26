export type TargetType = 'local' | 'event';
export type ReportReason = 'cancelled' | 'wrong_price' | 'wrong_location' | 'unsafe' | 'other';
export type ReportSeverity = 'low' | 'medium' | 'high';
export type ReportStatus = 'open' | 'reviewed' | 'resolved';

export interface ReportProps {
  id: string;
  reporterUserId: string | null;
  targetType: TargetType;
  localId: string | null;
  eventId: string | null;
  reason: ReportReason;
  comment: string | null;
  severity: ReportSeverity;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedBy: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

/** Aggregate Report (§4.1). Target polimórfico local|event. */
export class Report {
  private constructor(private readonly props: ReportProps) {}

  static file(input: {
    id: string;
    reporterUserId: string | null;
    targetType: TargetType;
    localId?: string | null;
    eventId?: string | null;
    reason: ReportReason;
    comment?: string | null;
    severity: ReportSeverity;
  }): Report {
    return new Report({
      id: input.id,
      reporterUserId: input.reporterUserId,
      targetType: input.targetType,
      localId: input.localId ?? null,
      eventId: input.eventId ?? null,
      reason: input.reason,
      comment: input.comment ?? null,
      severity: input.severity,
      status: 'open',
      resolutionNote: null,
      resolvedBy: null,
      createdAt: new Date(),
      resolvedAt: null,
    });
  }

  static fromPersistence(props: ReportProps): Report {
    return new Report(props);
  }

  resolve(resolvedBy: string, note: string): void {
    this.props.status = 'resolved';
    this.props.resolvedBy = resolvedBy;
    this.props.resolutionNote = note;
    this.props.resolvedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get reporterUserId(): string | null {
    return this.props.reporterUserId;
  }
  get comment(): string | null {
    return this.props.comment;
  }
  get resolutionNote(): string | null {
    return this.props.resolutionNote;
  }
  get resolvedBy(): string | null {
    return this.props.resolvedBy;
  }
  get targetType(): TargetType {
    return this.props.targetType;
  }
  get localId(): string | null {
    return this.props.localId;
  }
  get eventId(): string | null {
    return this.props.eventId;
  }
  get reason(): ReportReason {
    return this.props.reason;
  }
  get severity(): ReportSeverity {
    return this.props.severity;
  }
  get status(): ReportStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
