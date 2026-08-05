import { describe, expect, it } from 'vitest';
import { joinStorageUrl } from './storage-url';

describe('joinStorageUrl', () => {
  it('convierte una key de S3 en URL absoluta', () => {
    expect(joinStorageUrl('http://10.0.0.5:4566', 'tickets/abc.png')).toBe(
      'http://10.0.0.5:4566/tickets/abc.png',
    );
  });

  it('no duplica barras entre la base y la key', () => {
    expect(joinStorageUrl('http://10.0.0.5:4566/', '/tickets/abc.png')).toBe(
      'http://10.0.0.5:4566/tickets/abc.png',
    );
  });

  it('devuelve tal cual una URL absoluta', () => {
    expect(joinStorageUrl('http://10.0.0.5:4566', 'https://cdn.ravenue.pe/a.png')).toBe(
      'https://cdn.ravenue.pe/a.png',
    );
  });

  it('devuelve null cuando no hay referencia', () => {
    expect(joinStorageUrl('http://10.0.0.5:4566', null)).toBeNull();
    expect(joinStorageUrl('http://10.0.0.5:4566', undefined)).toBeNull();
    expect(joinStorageUrl('http://10.0.0.5:4566', '')).toBeNull();
  });
});
