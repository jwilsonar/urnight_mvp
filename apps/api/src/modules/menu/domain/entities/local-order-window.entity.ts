import { MenuOrderWindowInvalidError } from '../errors/menu.errors';

export interface LocalOrderWindowProps {
  id: string;
  localId: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
}

/** Ventana semanal; endsAt < startsAt representa cruce de medianoche válido. */
export class LocalOrderWindow {
  private constructor(private readonly props: LocalOrderWindowProps) {}

  static create(props: LocalOrderWindowProps): LocalOrderWindow {
    if (
      !Number.isInteger(props.dayOfWeek) ||
      props.dayOfWeek < 0 ||
      props.dayOfWeek > 6 ||
      props.startsAt === props.endsAt
    ) {
      throw new MenuOrderWindowInvalidError();
    }
    return new LocalOrderWindow(props);
  }

  static fromPersistence(props: LocalOrderWindowProps): LocalOrderWindow {
    return new LocalOrderWindow(props);
  }

  get id(): string {
    return this.props.id;
  }
  get localId(): string {
    return this.props.localId;
  }
  get dayOfWeek(): number {
    return this.props.dayOfWeek;
  }
  get startsAt(): string {
    return this.props.startsAt;
  }
  get endsAt(): string {
    return this.props.endsAt;
  }
}
