'use client';

import { FloppyDisk } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@urnight/ui';
import {
  INITIAL_LEVEL_RULES,
  INITIAL_POINT_RULES,
  type LoyaltyLevelRule,
  type LoyaltyPointRule,
} from './fidelizacion-config';

function validationMessage(pointRules: LoyaltyPointRule[], levels: LoyaltyLevelRule[]) {
  if (pointRules.some((rule) => !Number.isInteger(rule.points) || rule.points < 0 || rule.points > 10000)) {
    return 'Los puntos deben ser enteros entre 0 y 10 000.';
  }
  if (levels.some((level) => !Number.isInteger(level.threshold) || level.threshold < 0)) {
    return 'Los umbrales deben ser enteros mayores o iguales a 0.';
  }
  if (levels.some((level, index) => index > 0 && level.threshold <= levels[index - 1]!.threshold)) {
    return 'Los umbrales deben aumentar de un nivel al siguiente.';
  }
  if (levels.some((level) => !Number.isFinite(level.multiplier) || level.multiplier < 1 || level.multiplier > 5)) {
    return 'Los multiplicadores deben estar entre 1 y 5.';
  }
  return null;
}

export function FidelizacionRulesEditor() {
  const [pointRules, setPointRules] = useState<LoyaltyPointRule[]>(() =>
    INITIAL_POINT_RULES.map((rule) => ({ ...rule })),
  );
  const [levels, setLevels] = useState<LoyaltyLevelRule[]>(() => INITIAL_LEVEL_RULES.map((level) => ({ ...level })));

  function saveRules() {
    const error = validationMessage(pointRules, levels);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Reglas de fidelización guardadas en el mock.');
  }

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="p-0">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Puntos por acción</CardTitle>
            <CardDescription>Define cuántos puntos acredita cada actividad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-2">
            {pointRules.map((rule) => (
              <div
                key={rule.id}
                className="grid items-end gap-3 rounded-md border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_7rem]"
              >
                <p className="text-sm font-medium text-foreground">{rule.action}</p>
                <div className="space-y-1.5">
                  <Label htmlFor={`${rule.id}-points`} className="text-xs text-muted-foreground">
                    Puntos
                  </Label>
                  <Input
                    id={`${rule.id}-points`}
                    type="number"
                    min={0}
                    max={10000}
                    step={1}
                    value={rule.points}
                    onChange={(event) =>
                      setPointRules((current) =>
                        current.map((item) =>
                          item.id === rule.id ? { ...item, points: Number(event.target.value) } : item,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Niveles y multiplicadores</CardTitle>
            <CardDescription>
              Configura el umbral mínimo y el factor aplicado a los puntos de cada nivel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-2">
            {levels.map((level) => (
              <div
                key={level.id}
                className="grid gap-3 rounded-md border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem] sm:items-end"
              >
                <p className="self-center text-sm font-semibold text-foreground">{level.name}</p>
                <div className="space-y-1.5">
                  <Label htmlFor={`${level.id}-threshold`} className="text-xs text-muted-foreground">
                    Umbral
                  </Label>
                  <Input
                    id={`${level.id}-threshold`}
                    type="number"
                    min={0}
                    step={1}
                    value={level.threshold}
                    onChange={(event) =>
                      setLevels((current) =>
                        current.map((item) =>
                          item.id === level.id ? { ...item, threshold: Number(event.target.value) } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${level.id}-multiplier`} className="text-xs text-muted-foreground">
                    Multiplicador
                  </Label>
                  <Input
                    id={`${level.id}-multiplier`}
                    type="number"
                    min={1}
                    max={5}
                    step={0.05}
                    value={level.multiplier}
                    onChange={(event) =>
                      setLevels((current) =>
                        current.map((item) =>
                          item.id === level.id
                            ? {
                                ...item,
                                multiplier: Number(event.target.value),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={saveRules}>
          <FloppyDisk className="h-4 w-4" weight="bold" />
          Guardar reglas
        </Button>
      </div>
    </div>
  );
}
