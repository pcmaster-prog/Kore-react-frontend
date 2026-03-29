# Kore — Correo de Bienvenida + Documentos + Cambiar Contraseña: Frontend

Stack: React 18 · TypeScript · Tailwind CSS · Vercel

---

## 1. Cambiar Contraseña en ProfilePage

**Modificar `src/features/profile/ProfilePage.tsx`:**

Agregar una nueva sección "Cambiar Contraseña" debajo de Información Laboral.

### Estado nuevo:
```tsx
const [changingPassword, setChangingPassword] = useState(false);
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [savingPassword, setSavingPassword] = useState(false);
```

### Función:
```tsx
async function savePassword() {
  if (newPassword !== confirmPassword) {
    showToast('err', 'Las contraseñas no coinciden');
    return;
  }
  if (newPassword.length < 6) {
    showToast('err', 'La contraseña debe tener al menos 6 caracteres');
    return;
  }
  setSavingPassword(true);
  try {
    await api.post('/mi-perfil/password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    });
    showToast('ok', 'Contraseña actualizada correctamente');
    setChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch (e: any) {
    showToast('err', e?.response?.data?.message ?? 'Error al cambiar contraseña');
  } finally {
    setSavingPassword(false);
  }
}
```

### UI de la sección (agregar después de "Información Laboral"):
```tsx
<div className="rounded-3xl border bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <span>🔑</span>
      <span className="font-semibold">Contraseña</span>
    </div>
    {!changingPassword ? (
      <button
        onClick={() => setChangingPassword(true)}
        className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition"
      >
        ✏️ Cambiar
      </button>
    ) : (
      <div className="flex gap-2">
        <button
          onClick={() => {
            setChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
          className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition"
        >
          Cancelar
        </button>
        <button
          onClick={savePassword}
          disabled={savingPassword}
          className="rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition disabled:opacity-50"
        >
          {savingPassword ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    )}
  </div>

  {!changingPassword ? (
    <div className="text-sm text-neutral-500">
      ••••••••••
      <span className="ml-2 text-xs text-neutral-400">
        Por seguridad tu contraseña no se muestra
      </span>
    </div>
  ) : (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-neutral-500 mb-1">Contraseña actual</div>
        <input
          type="password"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Tu contraseña actual"
        />
      </div>
      <div>
        <div className="text-xs text-neutral-500 mb-1">Nueva contraseña</div>
        <input
          type="password"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      <div>
        <div className="text-xs text-neutral-500 mb-1">Confirmar nueva contraseña</div>
        <input
          type="password"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la nueva contraseña"
        />
      </div>
      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <div className="text-xs text-rose-600">Las contraseñas no coinciden</div>
      )}
    </div>
  )}
</div>
```

---

## 2. Documentos de Empresa en ConfiguracionPage

**Modificar `src/features/configuracion/ConfiguracionPage.tsx`:**

Agregar nueva sección "Documentos" dentro de la tab existente de `HorariosTab`
o crear un componente `DocumentosTab` independiente.

**Recomendado: agregar como nueva tab `documentos`.**

### Agregar al array TABS:
```tsx
{ key: "documentos", label: "Documentos", icon: <FileText className="h-4 w-4" /> }
```

### Crear componente `DocumentosTab`:

```tsx
function DocumentosTab() {
  const [documentos, setDocumentos] = useState<Array<{
    nombre: string;
    url: string;
    size: number;
    uploaded_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    api.get('/empresa/documentos')
      .then(res => setDocumentos(res.data?.documentos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showToast('err', 'Solo se permiten archivos PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('err', 'El archivo no puede superar 10MB');
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/empresa/documentos', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocumentos(res.data?.documentos ?? []);
      showToast('ok', 'Documento subido correctamente');
    } catch (e: any) {
      showToast('err', e?.response?.data?.message ?? 'Error al subir documento');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(index: number) {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      const res = await api.delete(`/empresa/documentos/${index}`);
      setDocumentos(res.data?.documentos ?? []);
      showToast('ok', 'Documento eliminado');
    } catch {
      showToast('err', 'No se pudo eliminar');
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={cx(
          'rounded-2xl border px-4 py-3 text-sm font-medium',
          toast.type === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        )}>
          {toast.type === 'ok' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Documentos de Bienvenida</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Estos documentos se adjuntarán automáticamente al correo de bienvenida
          de cada nuevo empleado.
        </p>
      </div>

      {/* Zona de upload */}
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
        <div className="text-3xl mb-2">📄</div>
        <div className="text-sm font-medium text-neutral-700 mb-1">
          {uploading ? 'Subiendo documento...' : 'Subir documento PDF'}
        </div>
        <div className="text-xs text-neutral-500 mb-3">
          Solo PDF · Máximo 10MB por archivo
        </div>
        <label className={cx(
          'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition cursor-pointer',
          uploading
            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            : 'bg-neutral-900 text-white hover:bg-neutral-700'
        )}>
          {uploading ? '⏳ Subiendo...' : '+ Agregar documento'}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Lista de documentos */}
      {loading ? (
        <div className="text-sm text-neutral-500 text-center py-4">Cargando documentos...</div>
      ) : documentos.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <div className="text-2xl mb-2">📂</div>
          <div className="text-sm text-neutral-500">
            No hay documentos. Sube el primer documento y se adjuntará
            automáticamente a los correos de bienvenida.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc, index) => (
            <div
              key={index}
              className="rounded-2xl border bg-white px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <div className="text-sm font-medium text-neutral-900">{doc.nombre}</div>
                  <div className="text-xs text-neutral-400">
                    {formatSize(doc.size)} ·{' '}
                    {new Date(doc.uploaded_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition"
                >
                  Ver
                </a>
                <button
                  onClick={() => handleDelete(index)}
                  className="rounded-xl border border-rose-200 text-rose-600 px-3 py-1.5 text-xs font-medium hover:bg-rose-50 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        💡 Los documentos se envían adjuntos en el correo de bienvenida cuando creas
        un nuevo empleado. Puedes subir contratos, reglamentos, protocolos o cualquier
        documento que necesiten al ingresar.
      </div>
    </div>
  );
}
```

---

## 3. Indicador visual en creación de empleado

**Modificar `src/features/employees/EmpleadosPage.tsx`:**

En el modal de creación de usuario (`UserModal`), agregar un banner informativo
al final del formulario (antes del footer) para que el admin sepa que se enviará
el correo automáticamente:

```tsx
{/* Solo mostrar en modo create */}
{mode === 'create' && (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
    📧 Se enviará automáticamente un correo de bienvenida al empleado con sus
    credenciales de acceso y los documentos configurados.
  </div>
)}
```

---

## 4. Resumen de archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/features/profile/ProfilePage.tsx` | Modificar — agregar sección cambiar contraseña |
| `src/features/configuracion/ConfiguracionPage.tsx` | Modificar — agregar tab Documentos con DocumentosTab |
| `src/features/employees/EmpleadosPage.tsx` | Modificar — banner informativo en modal de creación |
