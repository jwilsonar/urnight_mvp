import {
  changeMenuProductPriceSchema,
  createMenuCategorySchema,
  createMenuProductSchema,
  localOrderWindowListResponseSchema,
  localPolicyResponseSchema,
  menuCategoryListResponseSchema,
  menuCategoryResponseSchema,
  menuPriceChangeResponseSchema,
  menuProductListResponseSchema,
  menuProductResponseSchema,
  renameMenuCategorySchema,
  reorderMenuCategorySchema,
  replaceLocalOrderWindowsSchema,
  setMenuProductAvailabilitySchema,
  updateLocalPolicySchema,
  updateMenuProductSchema,
} from '@urnight/contracts';
import { z } from 'zod';
import { json, problemSchema, registry } from '../../../../openapi/registry';

const bearer = [{ bearerAuth: [] }];
const problem = (description: string) => ({ description, ...json(problemSchema) });
const localParams = z.object({ localId: z.string().uuid() });
const categoryParams = localParams.extend({ categoryId: z.string().uuid() });
const productParams = localParams.extend({ productId: z.string().uuid() });

export function registerMenuDocs(): void {
  const Category = registry.register('MenuCategoryResponse', menuCategoryResponseSchema);
  const Product = registry.register('MenuProductResponse', menuProductResponseSchema);
  const Policy = registry.register('LocalPolicyResponse', localPolicyResponseSchema);
  const PriceChange = registry.register(
    'MenuPriceChangeResponse',
    menuPriceChangeResponseSchema,
  );
  const CreateCategory = registry.register('CreateMenuCategoryDto', createMenuCategorySchema);
  const RenameCategory = registry.register('RenameMenuCategoryDto', renameMenuCategorySchema);
  const ReorderCategory = registry.register('ReorderMenuCategoryDto', reorderMenuCategorySchema);
  const CreateProduct = registry.register('CreateMenuProductDto', createMenuProductSchema);
  const UpdateProduct = registry.register('UpdateMenuProductDto', updateMenuProductSchema);
  const Availability = registry.register(
    'SetMenuProductAvailabilityDto',
    setMenuProductAvailabilitySchema,
  );
  const ChangePrice = registry.register(
    'ChangeMenuProductPriceDto',
    changeMenuProductPriceSchema,
  );
  const UpdatePolicy = registry.register('UpdateLocalPolicyDto', updateLocalPolicySchema);
  const ReplaceWindows = registry.register(
    'ReplaceLocalOrderWindowsDto',
    replaceLocalOrderWindowsSchema,
  );

  registry.registerPath({
    method: 'get',
    path: '/locals/{localId}/menu/categories',
    tags: ['Menu'],
    summary: 'Listar categorías de carta (público)',
    request: { params: localParams },
    responses: {
      200: { description: 'Categorías ordenadas', ...json(menuCategoryListResponseSchema) },
      404: problem('Local no encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/locals/{localId}/menu/categories',
    tags: ['Menu'],
    summary: 'Crear categoría',
    security: bearer,
    request: { params: localParams, body: json(CreateCategory) },
    responses: {
      201: { description: 'Categoría creada', ...json(Category) },
      403: problem('Tenant no permitido'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/locals/{localId}/menu/categories/{categoryId}/name',
    tags: ['Menu'],
    summary: 'Renombrar categoría',
    security: bearer,
    request: { params: categoryParams, body: json(RenameCategory) },
    responses: {
      200: { description: 'Categoría renombrada', ...json(Category) },
      404: problem('Categoría no encontrada'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/locals/{localId}/menu/categories/{categoryId}/order',
    tags: ['Menu'],
    summary: 'Reordenar categoría',
    security: bearer,
    request: { params: categoryParams, body: json(ReorderCategory) },
    responses: {
      200: { description: 'Categoría reordenada', ...json(Category) },
      404: problem('Categoría no encontrada'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/locals/{localId}/menu/products',
    tags: ['Menu'],
    summary: 'Listar productos con precio vigente (público)',
    request: { params: localParams },
    responses: {
      200: { description: 'Productos del local', ...json(menuProductListResponseSchema) },
      404: problem('Local o precio vigente no encontrado'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/locals/{localId}/menu/products/{productId}',
    tags: ['Menu'],
    summary: 'Leer producto con precio vigente (público)',
    request: { params: productParams },
    responses: {
      200: { description: 'Producto', ...json(Product) },
      404: problem('Producto o precio vigente no encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/locals/{localId}/menu/products',
    tags: ['Menu'],
    summary: 'Crear producto con precio inicial',
    security: bearer,
    request: { params: localParams, body: json(CreateProduct) },
    responses: {
      201: { description: 'Producto creado', ...json(Product) },
      404: problem('Categoría no encontrada'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/locals/{localId}/menu/products/{productId}',
    tags: ['Menu'],
    summary: 'Editar producto sin alterar el precio',
    security: bearer,
    request: { params: productParams, body: json(UpdateProduct) },
    responses: {
      200: { description: 'Producto editado', ...json(Product) },
      404: problem('Producto no encontrado'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/locals/{localId}/menu/products/{productId}/availability',
    tags: ['Menu'],
    summary: 'Cambiar disponibilidad',
    security: bearer,
    request: { params: productParams, body: json(Availability) },
    responses: {
      200: { description: 'Disponibilidad actualizada', ...json(Product) },
      404: problem('Producto no encontrado'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/locals/{localId}/menu/products/{productId}/prices',
    tags: ['Menu'],
    summary: 'Versionar precio del producto',
    security: bearer,
    request: { params: productParams, body: json(ChangePrice) },
    responses: {
      200: { description: 'Precio anterior y nuevo', ...json(PriceChange) },
      404: problem('Producto o precio vigente no encontrado'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/locals/{localId}/menu/policy',
    tags: ['Menu'],
    summary: 'Leer política del local',
    security: bearer,
    request: { params: localParams },
    responses: { 200: { description: 'Política', ...json(Policy) } },
  });

  registry.registerPath({
    method: 'put',
    path: '/locals/{localId}/menu/policy',
    tags: ['Menu'],
    summary: 'Editar política del local',
    security: bearer,
    request: { params: localParams, body: json(UpdatePolicy) },
    responses: {
      200: { description: 'Política actualizada', ...json(Policy) },
      422: problem('Porcentaje de depósito inválido'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/locals/{localId}/menu/order-windows',
    tags: ['Menu'],
    summary: 'Leer horario de pedidos (público)',
    request: { params: localParams },
    responses: {
      200: { description: 'Ventanas semanales', ...json(localOrderWindowListResponseSchema) },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/locals/{localId}/menu/order-windows',
    tags: ['Menu'],
    summary: 'Reemplazar horario de pedidos',
    security: bearer,
    request: { params: localParams, body: json(ReplaceWindows) },
    responses: {
      200: { description: 'Ventanas actualizadas', ...json(localOrderWindowListResponseSchema) },
      422: problem('Horario inválido'),
    },
  });
}
