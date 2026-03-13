type Props = {
  title?: string;
  message?: string;
};

export function AccessDeniedState({
  title = "Acesso negado",
  message = "Esta área está disponível apenas para usuários autorizados da sua empresa.",
}: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6 py-10">
      <div className="app-card w-full max-w-xl p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--warning)]">
          Permissão insuficiente
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--card-foreground)]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{message}</p>
      </div>
    </div>
  );
}