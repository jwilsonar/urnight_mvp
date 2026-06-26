import type { FavoriteTargetType } from '@urnight/contracts';

export interface FavoriteProps {
  id: string;
  userId: string;
  targetType: FavoriteTargetType;
  localId: string | null;
  eventId: string | null;
  createdAt: Date;
}

/**
 * Favorito polimórfico del usuario (§4.3: "exactamente uno de local_id/event_id").
 * El dominio es dueño de la invariante: `create` deriva local_id/event_id del
 * targetType, garantizando que solo uno queda poblado.
 */
export class Favorite {
  private constructor(private readonly props: FavoriteProps) {}

  static create(input: {
    id: string;
    userId: string;
    targetType: FavoriteTargetType;
    targetId: string;
  }): Favorite {
    const isLocal = input.targetType === 'local';
    return new Favorite({
      id: input.id,
      userId: input.userId,
      targetType: input.targetType,
      localId: isLocal ? input.targetId : null,
      eventId: isLocal ? null : input.targetId,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: FavoriteProps): Favorite {
    return new Favorite(props);
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get targetType(): FavoriteTargetType {
    return this.props.targetType;
  }
  get localId(): string | null {
    return this.props.localId;
  }
  get eventId(): string | null {
    return this.props.eventId;
  }
  /** Id del target apuntado (sea local o event). */
  get targetId(): string {
    return (this.props.localId ?? this.props.eventId) as string;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
