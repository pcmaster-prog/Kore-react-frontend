/**
 * Extrae un mensaje legible de un error de Axios/u otro error.
 * Útil para evitar `any` en bloques catch.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosLike = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    axiosLike.response?.data?.message ?? axiosLike.message ?? fallback
  );
}
