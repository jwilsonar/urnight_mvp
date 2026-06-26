import { describe, expect, it } from 'vitest';
import { InMemoryUserFavoriteRepository } from '../../../../shared/testing';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
} from '../../domain/errors/identity.errors';
import { AddFavoriteUseCase } from './add-favorite.use-case';
import { ListFavoritesUseCase } from './list-favorites.use-case';
import { RemoveFavoriteUseCase } from './remove-favorite.use-case';

function build() {
  const favorites = new InMemoryUserFavoriteRepository();
  return {
    favorites,
    add: new AddFavoriteUseCase(favorites),
    remove: new RemoveFavoriteUseCase(favorites),
    list: new ListFavoritesUseCase(favorites),
  };
}

const LOCAL_ID = '11111111-1111-1111-1111-111111111111';
const EVENT_ID = '22222222-2222-2222-2222-222222222222';

describe('Favorites use-cases', () => {
  it('agrega un favorito de local y deriva el target polimórfico', async () => {
    const { add, list } = build();
    await add.execute({ userId: 'u1', dto: { targetType: 'local', targetId: LOCAL_ID } });

    const result = await list.execute({ userId: 'u1' });
    expect(result).toHaveLength(1);
    expect(result[0]?.targetId).toBe(LOCAL_ID);
    expect(result[0]?.localId).toBe(LOCAL_ID);
    expect(result[0]?.eventId).toBeNull();
  });

  it('favorito duplicado → FavoriteAlreadyExistsError', async () => {
    const { add } = build();
    const dto = { targetType: 'local' as const, targetId: LOCAL_ID };
    await add.execute({ userId: 'u1', dto });
    await expect(add.execute({ userId: 'u1', dto })).rejects.toBeInstanceOf(
      FavoriteAlreadyExistsError,
    );
  });

  it('aísla por usuario (mismo target, otro user)', async () => {
    const { add, list } = build();
    const dto = { targetType: 'event' as const, targetId: EVENT_ID };
    await add.execute({ userId: 'u1', dto });
    await add.execute({ userId: 'u2', dto });
    expect(await list.execute({ userId: 'u2' })).toHaveLength(1);
  });

  it('quita un favorito existente', async () => {
    const { add, remove, list } = build();
    await add.execute({ userId: 'u1', dto: { targetType: 'local', targetId: LOCAL_ID } });
    await remove.execute({ userId: 'u1', targetType: 'local', targetId: LOCAL_ID });
    expect(await list.execute({ userId: 'u1' })).toHaveLength(0);
  });

  it('quitar inexistente → FavoriteNotFoundError', async () => {
    const { remove } = build();
    await expect(
      remove.execute({ userId: 'u1', targetType: 'event', targetId: EVENT_ID }),
    ).rejects.toBeInstanceOf(FavoriteNotFoundError);
  });
});
