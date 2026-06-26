// Config raíz — heredada por packages/* que no definen la suya (ESLint v9
// busca hacia arriba). Las apps (web/mobile/validator) tienen su propia config.
import base from '@urnight/config/eslint';

export default [...base];
