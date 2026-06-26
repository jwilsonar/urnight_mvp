export type TargetType = 'local' | 'event';
export type ReviewStatus = 'published' | 'hidden';

export interface ReviewProps {
  id: string;
  userId: string;
  targetType: TargetType;
  localId: string | null;
  eventId: string | null;
  ticketId: string | null;
  rating: number;
  comment: string | null;
  quickTags: string[] | null;
  isVerified: boolean;
  isReported: boolean;
  status: ReviewStatus;
  createdAt: Date;
}

/** Aggregate Review (§4.1). Solo comprador asistente verificado (isVerified). */
export class Review {
  private constructor(private readonly props: ReviewProps) {}

  static create(input: {
    id: string;
    userId: string;
    targetType: TargetType;
    localId?: string | null;
    eventId?: string | null;
    ticketId: string;
    rating: number;
    comment?: string | null;
    quickTags?: string[] | null;
    isVerified: boolean;
  }): Review {
    return new Review({
      id: input.id,
      userId: input.userId,
      targetType: input.targetType,
      localId: input.localId ?? null,
      eventId: input.eventId ?? null,
      ticketId: input.ticketId,
      rating: input.rating,
      comment: input.comment ?? null,
      quickTags: input.quickTags ?? null,
      isVerified: input.isVerified,
      isReported: false,
      status: 'published',
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: ReviewProps): Review {
    return new Review(props);
  }

  hide(): void {
    this.props.status = 'hidden';
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get ticketId(): string | null {
    return this.props.ticketId;
  }
  get quickTags(): string[] | null {
    return this.props.quickTags;
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
  get rating(): number {
    return this.props.rating;
  }
  get comment(): string | null {
    return this.props.comment;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  get status(): ReviewStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
