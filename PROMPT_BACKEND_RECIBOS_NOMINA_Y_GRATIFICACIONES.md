# Prompt Backend: Módulo de Recibos de Nómina y Gratificaciones con Firma Digital

## Contexto
El frontend Kore (React) necesita un módulo completo para que los empleados puedan ver y firmar sus recibos de nómina y gratificaciones. El admin genera/aprueba la nómina y las gratificaciones, y los empleados acceden a sus recibos individuales para revisarlos y firmarlos digitalmente.

---

## 1. Migraciones Nuevas

### 1.1 `employees` (modificar tabla existente)
Agregar campo:
```php
$table->string('curp', 18)->nullable()->after('nss');
```

### 1.2 `payroll_receipts` (recibos de nómina individuales)
```php
Schema::create('payroll_receipts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('payroll_period_id')->constrained('payroll_periods')->onDelete('cascade');
    $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    
    // Folio y estado
    $table->string('folio', 20)->unique(); // ej: "NOM-2024-001-001"
    $table->enum('status', ['pending', 'signed', 'disputed'])->default('pending');
    
    // Período
    $table->date('period_start');
    $table->date('period_end');
    $table->date('payment_date')->nullable();
    
    // Datos del empleado (snapshot al momento de generar)
    $table->string('employee_name');
    $table->string('position_title')->nullable();
    $table->string('nss', 20)->nullable();
    $table->string('rfc', 13)->nullable();
    $table->string('curp', 18)->nullable();
    $table->decimal('daily_salary', 12, 2)->default(0);
    $table->decimal('sbc', 12, 2)->default(0); // Salario Base de Cotización
    $table->unsignedTinyInteger('days_worked')->default(0);
    
    // Percepciones (desglose)
    $table->json('perceptions')->nullable(); // [{"concept":"001 Sueldo","amount":7500.00}, ...]
    $table->decimal('total_perceptions', 12, 2)->default(0);
    
    // Deducciones (desglose)
    $table->json('deductions')->nullable(); // [{"concept":"001 ISR Retenido","amount":950.00}, ...]
    $table->decimal('total_deductions', 12, 2)->default(0);
    
    // Totales
    $table->decimal('net_pay', 12, 2)->default(0);
    $table->string('net_pay_words')->nullable(); // "Son: Seis mil trescientos sesenta y cinco pesos 00/100 M.N."
    
    // Forma de pago
    $table->string('payment_method')->default('Transferencia Electrónica');
    $table->string('bank_account')->nullable();
    $table->string('clabe')->nullable();
    
    // Metadata
    $table->timestamp('generated_at');
    $table->timestamp('approved_at')->nullable();
    $table->timestamps();
    
    $table->index(['employee_id', 'status']);
    $table->index(['payroll_period_id', 'status']);
});
```

### 1.3 `gratification_types` (tipos configurables por empresa)
```php
Schema::create('gratification_types', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->onDelete('cascade'); // o usar el tenant actual
    $table->string('code', 10)->unique(); // "AGUINALDO", "BONO", "PTU"
    $table->string('name'); // "Aguinaldo Anual"
    $table->string('description')->nullable();
    $table->enum('frequency', ['annual', 'biannual', 'quarterly', 'monthly', 'one_time'])->default('annual');
    $table->boolean('is_active')->default(true);
    $table->json('calculation_rules')->nullable(); // {"min_days":365,"taxable_percentage":1.0}
    $table->timestamps();
});
```

**Seed inicial:**
- `AGUINALDO` - Aguinaldo Anual (frequency: annual)
- `BONO` - Bono de Productividad (frequency: one_time)
- `PTU` - Participación de Utilidades (frequency: annual)
- `BONO_ANTIG` - Bono por Antigüedad (frequency: annual)

### 1.4 `gratification_receipts` (recibos de gratificación)
```php
Schema::create('gratification_receipts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('gratification_type_id')->constrained('gratification_types')->onDelete('restrict');
    $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    
    // Folio y estado
    $table->string('folio', 20)->unique(); // ej: "G-AGU-2024-001"
    $table->enum('status', ['draft', 'approved', 'signed', 'disputed'])->default('draft');
    
    // Ejercicio/Período
    $table->string('fiscal_year', 4);
    $table->date('issue_date');
    $table->date('payment_date')->nullable();
    
    // Datos del empleado (snapshot)
    $table->string('employee_name');
    $table->string('position_title')->nullable();
    $table->string('nss', 20)->nullable();
    $table->string('rfc', 13)->nullable();
    $table->string('curp', 18)->nullable();
    
    // Desglose del pago
    $table->json('payment_breakdown')->nullable(); // [{"concept":"Aguinaldo Gravado","amount":5000.00}, ...]
    $table->decimal('total_gratification', 12, 2)->default(0);
    
    // Retenciones
    $table->json('retentions')->nullable(); // [{"concept":"ISR s/Gratificación","amount":800.00}]
    $table->decimal('total_retentions', 12, 2)->default(0);
    
    // Neto
    $table->decimal('net_amount', 12, 2)->default(0);
    $table->string('net_amount_words')->nullable();
    
    // Concepto específico
    $table->text('concept_description')->nullable(); // ej: "Aguinaldo correspondiente al ejercicio fiscal 2024"
    
    // Metadata
    $table->timestamp('generated_at')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
    $table->timestamps();
    
    $table->index(['employee_id', 'fiscal_year', 'status']);
    $table->index(['gratification_type_id', 'status']);
});
```

### 1.5 `receipt_signatures` (firmas de recibos - polimórfica)
```php
Schema::create('receipt_signatures', function (Blueprint $table) {
    $table->id();
    $table->morphs('receivable'); // payroll_receipt_id o gratification_receipt_id
    $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    
    // Firma visual (imagen base64 guardada como archivo o texto largo)
    $table->text('signature_image')->nullable(); // base64 de la firma dibujada
    $table->string('signature_image_path')->nullable(); // ruta del archivo si se guarda en storage
    
    // Confirmación de identidad
    $table->boolean('password_verified')->default(false);
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent', 500)->nullable();
    
    // Integridad del documento
    $table->string('document_hash', 64)->nullable(); // SHA-256 del contenido del recibo en el momento de firmar
    $table->timestamp('signed_at');
    $table->timestamps();
});
```

---

## 2. Modelos Eloquent

### PayrollReceipt
```php
class PayrollReceipt extends Model
{
    protected $fillable = [/* todos los campos de la migración */];
    protected $casts = [
        'perceptions' => 'array',
        'deductions' => 'array',
        'period_start' => 'date',
        'period_end' => 'date',
        'payment_date' => 'date',
        'generated_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function employee() { return $this->belongsTo(Employee::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function payrollPeriod() { return $this->belongsTo(PayrollPeriod::class); }
    public function signature() { return $this->morphOne(ReceiptSignature::class, 'receivable'); }
    
    // Generar folio automático: NOM-{año}-{semana}-{secuencia}
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($receipt) {
            if (empty($receipt->folio)) {
                $year = now()->format('Y');
                $week = now()->format('W');
                $last = static::whereYear('generated_at', $year)->count();
                $receipt->folio = sprintf("NOM-%s-%03d-%03d", $year, $week, $last + 1);
            }
        });
    }
}
```

### GratificationType
```php
class GratificationType extends Model
{
    protected $fillable = ['company_id','code','name','description','frequency','is_active','calculation_rules'];
    protected $casts = ['calculation_rules' => 'array', 'is_active' => 'boolean'];
    
    public function receipts() { return $this->hasMany(GratificationReceipt::class); }
}
```

### GratificationReceipt
```php
class GratificationReceipt extends Model
{
    protected $fillable = [/* todos los campos */];
    protected $casts = [
        'payment_breakdown' => 'array',
        'retentions' => 'array',
        'issue_date' => 'date',
        'payment_date' => 'date',
        'generated_at' => 'datetime',
        'approved_at' => 'datetime',
    ];
    
    public function gratificationType() { return $this->belongsTo(GratificationType::class); }
    public function employee() { return $this->belongsTo(Employee::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
    public function signature() { return $this->morphOne(ReceiptSignature::class, 'receivable'); }
    
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($receipt) {
            if (empty($receipt->folio)) {
                $prefix = strtoupper(substr($receipt->gratificationType->code ?? 'GRAT', 0, 3));
                $year = now()->format('Y');
                $last = static::whereYear('issue_date', $year)->count();
                $receipt->folio = sprintf("G-%s-%s-%03d", $prefix, $year, $last + 1);
            }
        });
    }
}
```

### ReceiptSignature
```php
class ReceiptSignature extends Model
{
    protected $fillable = ['receivable_type','receivable_id','employee_id','user_id',
        'signature_image','signature_image_path','password_verified','ip_address',
        'user_agent','document_hash','signed_at'];
    protected $casts = ['password_verified' => 'boolean', 'signed_at' => 'datetime'];
    
    public function receivable() { return $this->morphTo(); }
    public function employee() { return $this->belongsTo(Employee::class); }
    public function user() { return $this->belongsTo(User::class); }
}
```

---

## 3. Endpoints API (prefix: `/api/v1`)

### 3.1 Endpoints para Empleado (requiere auth + rol empleado)

#### `GET /mis-recibos/nomina`
**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "folio": "NOM-2024-042-001",
      "status": "signed",
      "period_start": "2024-10-07",
      "period_end": "2024-10-13",
      "payment_date": "2024-10-15",
      "net_pay": 6365.00,
      "total_perceptions": 8025.00,
      "total_deductions": 1660.00,
      "days_worked": 15,
      "position_title": "Analista",
      "signed_at": "2024-10-15T10:30:00Z",
      "can_sign": false
    }
  ],
  "pending_count": 2,
  "signed_count": 5
}
```
- Filtrar por `user_id` del empleado autenticado
- Ordenar por `period_start` DESC
- Solo mostrar recibos con status `approved` o `signed` (nunca `draft`)

#### `GET /mis-recibos/nomina/{id}`
**Respuesta completa con todo el desglose:**
```json
{
  "id": 1,
  "folio": "NOM-2024-042-001",
  "status": "pending",
  "period_start": "2024-10-01",
  "period_end": "2024-10-15",
  "payment_date": "2024-10-15",
  "employee_name": "Juan Pérez García",
  "position_title": "Analista",
  "nss": "12345678901",
  "rfc": "PEGJ800101ABC",
  "curp": "PEGJ800101HDFRRL09",
  "daily_salary": 500.00,
  "sbc": 520.50,
  "days_worked": 15,
  "perceptions": [
    {"code": "001", "concept": "Sueldo", "amount": 7500.00},
    {"code": "002", "concept": "Horas Extra", "amount": 400.00},
    {"code": "003", "concept": "Prima Dominical", "amount": 125.00}
  ],
  "total_perceptions": 8025.00,
  "deductions": [
    {"code": "001", "concept": "ISR Retenido", "amount": 950.00},
    {"code": "002", "concept": "Cuota IMSS", "amount": 210.00},
    {"code": "003", "concept": "Desc. Préstamo", "amount": 500.00}
  ],
  "total_deductions": 1660.00,
  "net_pay": 6365.00,
  "net_pay_words": "Son: Seis mil trescientos sesenta y cinco pesos 00/100 M.N.",
  "payment_method": "Transferencia Electrónica",
  "bank_account": "****3562",
  "clabe": "****0001ABC",
  "generated_at": "2024-10-15T00:00:00Z",
  "approved_at": "2024-10-15T08:00:00Z",
  "signature": {
    "signed_at": null,
    "password_verified": false,
    "document_hash": null
  },
  "can_sign": true
}
```

#### `POST /mis-recibos/nomina/{id}/firmar`
**Request:**
```json
{
  "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANS...", // base64 del canvas
  "password": "contraseña_actual_del_empleado"
}
```
**Validaciones:**
1. Verificar que el recibo pertenezca al empleado autenticado
2. Verificar que el recibo esté en status `pending` (no firmado aún)
3. Verificar `password` contra la contraseña del usuario (Hash::check)
4. Generar `document_hash` = SHA-256 de los campos clave del recibo concatenados
5. Guardar la firma (guardar imagen en storage, guardar path en DB)
6. Actualizar status del recibo a `signed`
7. Crear registro en `receipt_signatures`

**Respuesta éxito:**
```json
{
  "success": true,
  "message": "Recibo firmado correctamente",
  "signature": {
    "signed_at": "2024-10-15T10:30:00Z",
    "document_hash": "a3f5c2..."
  }
}
```

**Errores posibles:**
- 403: "El recibo no pertenece a este empleado"
- 409: "Este recibo ya fue firmado"
- 422: "Contraseña incorrecta"
- 422: "La imagen de firma es requerida"

#### `GET /mis-recibos/gratificaciones`
**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "folio": "G-AGU-2024-005",
      "status": "approved",
      "gratification_type": {
        "id": 1,
        "code": "AGUINALDO",
        "name": "Aguinaldo Anual"
      },
      "fiscal_year": "2024",
      "issue_date": "2024-12-20",
      "net_amount": 7312.00,
      "total_gratification": 8112.00,
      "total_retentions": 800.00,
      "signed_at": null,
      "can_sign": true
    }
  ]
}
```
- Solo mostrar recibos con status `approved` o `signed`

#### `GET /mis-recibos/gratificaciones/{id}`
Estructura similar al recibo de nómina pero con:
```json
{
  "id": 1,
  "folio": "G-AGU-2024-005",
  "gratification_type": { "id": 1, "code": "AGUINALDO", "name": "Aguinaldo Anual" },
  "fiscal_year": "2024",
  "issue_date": "2024-12-20",
  "payment_date": "2024-12-20",
  "concept_description": "Aguinaldo correspondiente al ejercicio fiscal 2024",
  "employee_name": "Juan Pérez García",
  "position_title": "Analista",
  "nss": "12345678901",
  "rfc": "PEGJ800101ABC",
  "curp": "PEGJ800101HDFRRL09",
  "payment_breakdown": [
    {"concept": "Aguinaldo Gravado", "amount": 5000.00},
    {"concept": "Aguinaldo Exento", "amount": 3112.00}
  ],
  "total_gratification": 8112.00,
  "retentions": [
    {"concept": "ISR s/Gratificación", "amount": 800.00}
  ],
  "total_retentions": 800.00,
  "net_amount": 7312.00,
  "net_amount_words": "Son: Siete mil trescientos doce pesos 00/100 M.N.",
  "approved_at": "2024-12-19T10:00:00Z",
  "signature": { ... },
  "can_sign": true
}
```

#### `POST /mis-recibos/gratificaciones/{id}/firmar`
Igual validación y flujo que el de nómina.

---

### 3.2 Endpoints para Admin

#### `GET /admin/tipos-gratificacion`
Listar todos los tipos configurables activos.

#### `POST /admin/tipos-gratificacion`
```json
{
  "code": "BONO_PROD",
  "name": "Bono de Productividad",
  "description": "Bono trimestral por cumplimiento de metas",
  "frequency": "quarterly",
  "calculation_rules": {"min_days":90,"taxable_percentage":1.0}
}
```

#### `PUT /admin/tipos-gratificacion/{id}`
Actualizar tipo.

#### `DELETE /admin/tipos-gratificacion/{id}`
Soft delete o validar que no tenga recibos asociados.

#### `GET /admin/gratificaciones`
Listar todos los recibos de gratificación generados (con filtros: tipo, año, estado, empleado).

#### `POST /admin/gratificaciones/generar`
Generar recibos de gratificación para un grupo de empleados.
```json
{
  "gratification_type_id": 1,
  "fiscal_year": "2024",
  "employee_ids": [1, 2, 3], // o "all" para todos los activos
  "issue_date": "2024-12-20",
  "payment_date": "2024-12-20",
  "amounts": {
    "1": {"gravado": 5000, "exento": 3112, "retentions": [{"concept": "ISR s/Gratificación", "amount": 800}]},
    "2": {"gravado": 4500, "exento": 2800, "retentions": [{"concept": "ISR s/Gratificación", "amount": 720}]}
  },
  "concept_description": "Aguinaldo correspondiente al ejercicio fiscal 2024"
}
```
- Crear registros en `gratification_receipts` con status `draft`
- Tomar snapshot de datos del empleado (nombre, nss, rfc, curp, puesto)

#### `POST /admin/gratificaciones/{id}/aprobar`
Cambiar status de `draft` a `approved`.
- Actualizar `approved_at` y `approved_by`

#### `POST /nomina/periodos/{id}/generar-recibos` (integración con nómina existente)
Cuando el admin aprueba la nómina (`POST /nomina/periodos/{id}/aprobar`), automáticamente generar un `PayrollReceipt` por cada empleado incluido en el periodo.
- Tomar snapshot de datos del empleado
- Calcular percepciones/deducciones desde las entradas del periodo
- Generar folio único
- Status inicial: `pending`

**Nota:** Si este endpoint ya se ejecuta en el `aprobar` existente, integrar la generación de recibos ahí mismo.

---

### 3.3 Modificación de endpoint existente

#### `PATCH /mi-perfil`
Agregar soporte para campo `curp`:
```json
{
  "full_name": "Juan Pérez",
  "phone": "5551234567",
  "address": "Calle 123",
  "curp": "PEGJ800101HDFRRL09"
}
```
Validar formato de CURP mexicano con regex: `/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$/`

#### `GET /mi-perfil` y `GET /usuarios/{id}`
Incluir campo `curp` en la respuesta.

---

## 4. Lógica de Negocio Importante

### 4.1 Generación automática de recibos de nómina
Al aprobar un periodo de nómina (`POST /nomina/periodos/{id}/aprobar`):
- Por cada `Entry` en el periodo (que no esté excluido):
  - Crear `PayrollReceipt` con snapshot del empleado
  - Desglosar percepciones: sueldo base, horas extra, prima dominical, días de descanso pagados, días feriados pagados, bonos
  - Desglosar deducciones: ISR, IMSS, retardos, faltas, préstamos
  - Calcular neto = percepciones - deducciones
  - Generar texto en letras (usar librería como `laravel-numero-a-letras` o función propia)
  - Status: `pending`

### 4.2 Texto en letras (Neto a pagar)
Implementar helper que convierta `$6,365.00` → `"Son: Seis mil trescientos sesenta y cinco pesos 00/100 M.N."`

### 4.3 Seguridad de firmas
- El `document_hash` debe ser SHA-256 de: folio + net_pay + total_perceptions + total_deductions + employee_id + period_start
- Si el empleado intenta firmar un recibo modificado después de generado, el hash no coincidiría (aunque en teoría los recibos no deberían modificarse después de aprobados)
- La imagen de firma debe guardarse en `storage/app/signatures/{año}/{mes}/` con nombre único
- Guardar el path en DB, no el base64 completo (el base64 puede venir en el request pero guardar como archivo)

### 4.4 Política de acceso
- Un empleado SOLO puede ver/firmar sus propios recibos
- Admin puede ver todos los recibos y quién ha firmado
- Supervisor NO tiene acceso a recibos (solo admin y el empleado dueño)

---

## 5. Notas para el Frontend

El frontend asumirá que estos endpoints existen y están listos. Se enviarán:
- `signature_image` como base64 PNG (data URL)
- `password` como texto plano (el backend hace Hash::check)
- Headers de autorización Bearer token
- Respuestas con códigos HTTP estándar (200, 201, 403, 409, 422)

---

## Checklist de Implementación Backend

- [ ] Migración `add_curp_to_employees_table`
- [ ] Migración `create_payroll_receipts_table`
- [ ] Migración `create_gratification_types_table`
- [ ] Migración `create_gratification_receipts_table`
- [ ] Migración `create_receipt_signatures_table`
- [ ] Seeders para `gratification_types`
- [ ] Modelos: `PayrollReceipt`, `GratificationType`, `GratificationReceipt`, `ReceiptSignature`
- [ ] Controlador `EmployeeReceiptController` (endpoints de empleado)
- [ ] Controlador `AdminGratificationController` (endpoints de admin)
- [ ] Policies: `PayrollReceiptPolicy`, `GratificationReceiptPolicy`
- [ ] Integrar generación de recibos en `PayrollPeriodController@approve`
- [ ] Helper `NumeroALetras` para net_pay_words
- [ ] Tests de feature para firmar recibo
