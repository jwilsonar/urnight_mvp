export interface ReferralLinkProps {
  id: string;
  promoterId: string;
  code: string;
  url: string;
  clicks: number;
  isActive: boolean;
}

/** Link de referido del promotor (§4.1). 1:1 con promoter. */
export class ReferralLink {
  private constructor(private readonly props: ReferralLinkProps) {}

  static create(input: { id: string; promoterId: string; code: string; url: string }): ReferralLink {
    return new ReferralLink({
      id: input.id,
      promoterId: input.promoterId,
      code: input.code,
      url: input.url,
      clicks: 0,
      isActive: true,
    });
  }

  static fromPersistence(props: ReferralLinkProps): ReferralLink {
    return new ReferralLink(props);
  }

  get id(): string {
    return this.props.id;
  }
  get promoterId(): string {
    return this.props.promoterId;
  }
  get code(): string {
    return this.props.code;
  }
  get url(): string {
    return this.props.url;
  }
  get clicks(): number {
    return this.props.clicks;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
}
