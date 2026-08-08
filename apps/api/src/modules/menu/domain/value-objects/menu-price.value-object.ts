export interface MenuPriceProps {
  id: string;
  productId: string;
  amount: number;
  currency: string;
  validFrom: Date;
  validTo: Date | null;
}

/** Precio versionado: vigente mientras validTo sea null. */
export class MenuPrice {
  private constructor(private readonly props: MenuPriceProps) {}

  static create(input: Omit<MenuPriceProps, 'validTo'>): MenuPrice {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new RangeError('El precio debe ser mayor que cero.');
    }
    return new MenuPrice({ ...input, currency: input.currency.toUpperCase(), validTo: null });
  }

  static fromPersistence(props: MenuPriceProps): MenuPrice {
    return new MenuPrice(props);
  }

  close(validTo: Date): void {
    this.props.validTo = validTo;
  }

  get id(): string {
    return this.props.id;
  }
  get productId(): string {
    return this.props.productId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get validFrom(): Date {
    return this.props.validFrom;
  }
  get validTo(): Date | null {
    return this.props.validTo;
  }
}
