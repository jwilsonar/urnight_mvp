'use client';

import { ArrowClockwise } from '@phosphor-icons/react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Button } from '@urnight/ui';
import { queryKeys } from '@/lib/api/query-keys';
import { PromoterSales } from './promoter-sales';

export function PromoterSalesWithRefresh({ promoterId }: { promoterId: string }) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.promoterSales(promoterId);
  const isFetching = useIsFetching({ queryKey }) > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isFetching}
          onClick={() => void queryClient.invalidateQueries({ queryKey })}
        >
          <ArrowClockwise className="size-4" weight="duotone" />
          Actualizar
        </Button>
      </div>
      <div className="[&>div>div:has(>button)]:hidden">
        <PromoterSales promoterId={promoterId} />
      </div>
    </div>
  );
}
