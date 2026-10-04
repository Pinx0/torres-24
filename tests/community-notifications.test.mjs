import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load the actual actions and notification code, replacing only external services.
// No test can contact Supabase, Storage or Brevo or read production credentials.
function loadSource(entry, services) {
  const modules = new Map();
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const loadedModule = { exports: {} };
    modules.set(file, loadedModule);
    const compiled = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    const resolve = (specifier) => {
      if (specifier in services) return services[specifier];
      if (specifier.startsWith("@/"))
        return load(path.join(root, "src", specifier.slice(2) + ".ts"));
      if (specifier.startsWith("."))
        return load(path.resolve(path.dirname(file), specifier + ".ts"));
      return require(specifier);
    };
    const run = new Function(
      "require",
      "module",
      "exports",
      "process",
      "console",
      compiled,
    );
    run(
      resolve,
      loadedModule,
      loadedModule.exports,
      { env: { BREVO_API_KEY: "test-only" } },
      services.console,
    );
    return loadedModule.exports;
  }
  return load(path.join(root, entry));
}

function fixture(options = {}) {
  const members = options.members ?? [
    { usuario_id: "author", unidad_familiar_codigo: "A-1" },
    { usuario_id: "same-home", unidad_familiar_codigo: "A-1" },
    { usuario_id: "neighbour", unidad_familiar_codigo: "B-2" },
    { usuario_id: "duplicate", unidad_familiar_codigo: "C-3" },
    { usuario_id: "no-email", unidad_familiar_codigo: "D-4" },
  ];
  const users = options.users ?? {
    author: {
      email: "author@example.test",
      user_metadata: { nombre: "Autora" },
    },
    "same-home": { email: "same-home@example.test" },
    neighbour: { email: " neighbour@example.test " },
    duplicate: { email: "NEIGHBOUR@example.test" },
    "no-email": { email: null },
  };
  const writes = [];
  const sends = [];
  const ranges = [];
  const errors = [];
  const createdAt = options.createdAt ?? "2026-07-15T11:00:00Z";
  const admin = {
    from(table) {
      let inserted;
      let equal;
      let range;
      let result;
      const execute = () => {
        if (result) return result;
        if (options.failTable === table)
          return { data: null, error: new Error("Database unavailable") };
        if (inserted !== undefined) {
          writes.push(table);
          result = {
            data: { ...inserted, id: "publication-id", created_at: createdAt },
            error: null,
          };
        } else {
          const sourceRows =
            options.rows?.[table] ??
            (table === "incidencias"
              ? [
                  {
                    id: "incident-id",
                    titulo: "Incidencia existente",
                    autor_usuario_id: "neighbour",
                  },
                ]
              : members);
          let rows = sourceRows.filter(
            (member) => !equal || member[equal[0]] === equal[1],
          );
          if (range) {
            rows = [...rows].sort((a, b) =>
              a.usuario_id.localeCompare(b.usuario_id),
            );
            rows = rows.slice(range[0], range[1] + 1);
            ranges.push(range);
          }
          result = { data: rows, error: null };
        }
        return result;
      };
      const query = {
        select() {
          return query;
        },
        eq(column, value) {
          equal = [column, value];
          return query;
        },
        order() {
          return query;
        },
        range(first, last) {
          range = [first, last];
          return query;
        },
        insert(value) {
          inserted = value;
          return query;
        },
        async single() {
          const response = execute();
          return {
            ...response,
            data: Array.isArray(response.data)
              ? response.data[0]
              : response.data,
          };
        },
        then(resolve, reject) {
          return Promise.resolve(execute()).then(resolve, reject);
        },
      };
      return query;
    },
    auth: {
      admin: {
        async getUserById(id) {
          if (options.failUser === id)
            return { data: null, error: new Error("Auth unavailable") };
          return { data: { user: users[id] ?? null }, error: null };
        },
      },
    },
  };
  const services = {
    console: {
      error: (...args) => errors.push(args),
      warn: (...args) => errors.push(args),
    },
    "server-only": {},
    "@/lib/supabase/admin": { createAdminClient: () => admin },
    "@/lib/supabase/server": {
      createClient: async () => ({
        from: admin.from,
        auth: {
          getUser: async () => ({
            data: { user: options.unauthenticated ? null : { id: "author" } },
            error: null,
          }),
        },
      }),
    },
    "@/lib/supabase/storage": {},
    "@getbrevo/brevo": {
      SendSmtpEmail: class {},
      TransactionalEmailsApi: class {
        authentications = { apiKey: { apiKey: "" } };
        async sendTransacEmail(email) {
          assert.equal(this.authentications.apiKey.apiKey, "test-only");
          sends.push({ ...structuredClone(email), writes: [...writes] });
          if (options.failEmail === email.to[0].email)
            throw new Error("Brevo unavailable");
        }
      },
    },
  };
  return {
    sends,
    writes,
    ranges,
    errors,
    load: (file) => loadSource(file, services),
  };
}

const flows = [
  {
    name: "votación",
    file: "src/app/votaciones/actions.ts",
    templateId: 5,
    idParam: "encuestaId",
    url: "/votaciones/publication-id",
    tables: ["encuestas", "encuesta_opciones"],
    create: (actions) =>
      actions.createPoll({
        titulo: " Título ",
        descripcion: " Descripción ",
        opciones: [{ texto: "Sí" }, { texto: "No" }],
      }),
  },
  {
    name: "incidencia",
    file: "src/app/incidencias/actions.ts",
    templateId: 6,
    idParam: "incidenciaId",
    url: "/incidencias/publication-id",
    tables: ["incidencias", "incidencias_adjuntos"],
    create: (actions) =>
      actions.createIncidencia(" Título ", " Descripción ", [
        { path: "image.jpg", mimeType: "image/jpeg", sizeBytes: 123 },
      ]),
  },
  {
    name: "documento",
    file: "src/app/documentacion/actions.ts",
    templateId: 7,
    idParam: "documentoId",
    url: "/documentacion",
    tables: ["documentos"],
    create: (actions) =>
      actions.createDocumento({
        titulo: " Título ",
        descripcion: " Descripción ",
        tipo: "libro_edificio",
        r2Key: "document.pdf",
        mimeType: "application/pdf",
        sizeBytes: 123,
      }),
  },
  {
    name: "comentario de incidencia",
    file: "src/app/incidencias/actions.ts",
    templateId: 8,
    idParam: "comentarioId",
    url: "/incidencias/incident-id",
    tables: ["incidencias_comentarios", "incidencias_adjuntos"],
    create: (actions) =>
      actions.createIncidenciaComentario(
        "incident-id",
        " Mensaje\nSegunda línea ",
        [{ path: "comment-image.jpg", mimeType: "image/jpeg", sizeBytes: 123 }],
      ),
  },
];

for (const flow of flows) {
  test(`${flow.name}: saved publication sends the correct template privately, excluding the author and duplicates`, async () => {
    const f = fixture();
    const result = await flow.create(f.load(flow.file));
    assert.equal(result.error, null);
    assert.equal(result.data.id, "publication-id");
    assert.deepEqual(f.writes, flow.tables);
    assert.deepEqual(f.sends.map((send) => send.to[0].email).sort(), [
      "neighbour@example.test",
      "same-home@example.test",
    ]);
    for (const send of f.sends) {
      assert.equal(send.to.length, 1);
      assert.equal(send.templateId, flow.templateId);
      assert.deepEqual(send.writes, flow.tables); // Children are already saved when Brevo is called.
      const expected = {
        titulo: "Título",
        descripcion: "Descripción",
        autorNombre: "Autora",
        autorUnidad: "A-1",
        fechaCreacion: "15/07/2026 13:00",
        urlDetalle: "https://torres24.org" + flow.url,
        [flow.idParam]: "publication-id",
      };
      if (flow.templateId === 7) expected.tipoDocumento = "Libro del edificio";
      if (flow.templateId === 8) {
        expected.titulo = "Incidencia existente";
        delete expected.descripcion;
        expected.incidenciaId = "incident-id";
        expected.mensaje = "Mensaje\nSegunda línea";
      }
      assert.deepEqual(send.params, expected);
    }
  });

  for (const failTable of flow.tables) {
    test(`${flow.name}: no email when saving ${failTable} fails`, async () => {
      const f = fixture({ failTable });
      const result = await flow.create(f.load(flow.file));
      assert.ok(result.error);
      assert.equal(f.sends.length, 0);
    });
  }

  test(`${flow.name}: Brevo failure preserves the publication and still attempts other recipients`, async () => {
    const f = fixture({ failEmail: "neighbour@example.test" });
    const result = await flow.create(f.load(flow.file));
    assert.equal(result.error, null);
    assert.equal(result.data.id, "publication-id");
    assert.equal(f.sends.length, 2);
    assert.ok(f.errors.length);
  });

  test(`${flow.name}: unauthenticated requests cannot save or send`, async () => {
    const f = fixture({ unauthenticated: true });
    const result = await flow.create(f.load(flow.file));
    assert.ok(result.error);
    assert.deepEqual(f.writes, []);
    assert.deepEqual(f.sends, []);
  });

  test(`${flow.name}: recipient lookup failure does not turn a saved publication into an error`, async () => {
    const f = fixture({ failUser: "neighbour" });
    const result = await flow.create(f.load(flow.file));
    assert.equal(result.error, null);
    assert.ok(
      f.sends.some((send) => send.to[0].email === "same-home@example.test"),
    );
  });
}

test("new email dates always use Madrid in summer and winter, regardless of server timezone", async () => {
  const original = process.env.TZ;
  try {
    for (const timeZone of ["UTC", "Europe/Madrid", "America/New_York"]) {
      process.env.TZ = timeZone;
      for (const [createdAt, expected] of [
        ["2026-07-15T11:00:00Z", "15/07/2026 13:00"],
        ["2026-01-15T12:00:00Z", "15/01/2026 13:00"],
        ["2026-07-14T22:30:00Z", "15/07/2026 00:30"],
      ]) {
        const f = fixture({ createdAt });
        await flows[2].create(f.load(flows[2].file));
        assert.ok(f.sends.length > 0);
        assert.equal(f.sends[0].params.fechaCreacion, expected);
      }
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("document without description or author metadata uses readable fallbacks", async () => {
  const f = fixture({
    users: {
      author: { email: "author@example.test" },
      neighbour: { email: "neighbour@example.test" },
    },
  });
  const actions = f.load("src/app/documentacion/actions.ts");
  const result = await actions.createDocumento({
    titulo: "Acta",
    tipo: "acta",
    r2Key: "acta.pdf",
    mimeType: "application/pdf",
    sizeBytes: 123,
  });
  assert.equal(result.error, null);
  assert.equal(f.sends[0].params.autorNombre, "Vecino");
  assert.equal(f.sends[0].params.descripcion, "Sin descripción adicional.");
  assert.equal(f.sends[0].params.autorUnidad, "A-1");
});

test("no email when the author is the only registered neighbour", async () => {
  const f = fixture({
    members: [{ usuario_id: "author", unidad_familiar_codigo: "A-1" }],
  });
  const result = await flows[0].create(f.load(flows[0].file));
  assert.equal(result.error, null);
  assert.deepEqual(f.sends, []);
});

test("all membership pages are read, even when there are more than 1000 users", async () => {
  const members = Array.from({ length: 1001 }, (_, index) => ({
    usuario_id: `neighbour-${String(index).padStart(4, "0")}`,
    unidad_familiar_codigo: "B-2",
  }));
  members.unshift({ usuario_id: "author", unidad_familiar_codigo: "A-1" });
  const f = fixture({
    members,
    users: {
      author: { email: "author@example.test" },
      "neighbour-1000": { email: "last-page@example.test" },
    },
  });
  const result = await flows[2].create(f.load(flows[2].file));
  assert.equal(result.error, null);
  assert.deepEqual(f.ranges, [
    [0, 999],
    [1000, 1999],
  ]);
  assert.deepEqual(
    f.sends.map((send) => send.to[0].email),
    ["last-page@example.test"],
  );
});

test("membership query failure preserves a saved document and sends nothing", async () => {
  const f = fixture({ failTable: "usuarios_unidades_familiares" });
  const result = await flows[2].create(f.load(flows[2].file));
  assert.equal(result.error, null);
  assert.deepEqual(f.writes, ["documentos"]);
  assert.deepEqual(f.sends, []);
});

test("comments notify neighbours who have never participated in that incident", async () => {
  const f = fixture();
  const result = await flows[3].create(f.load(flows[3].file));
  assert.equal(result.error, null);
  // The same-home user is neither the incident author nor a previous participant.
  assert.ok(
    f.sends.some((send) => send.to[0].email === "same-home@example.test"),
  );
});

test("failure to look up the incident title preserves the saved comment and sends nothing", async () => {
  const f = fixture({ failTable: "incidencias" });
  const result = await flows[3].create(f.load(flows[3].file));
  assert.equal(result.error, null);
  assert.equal(result.data.mensaje, "Mensaje\nSegunda línea");
  assert.deepEqual(f.writes, flows[3].tables);
  assert.deepEqual(f.sends, []);
});

test("comments without attachments notify after saving the text", async () => {
  const f = fixture({ createdAt: "2026-01-15T12:00:00Z" });
  const actions = f.load("src/app/incidencias/actions.ts");
  const result = await actions.createIncidenciaComentario(
    "incident-id",
    "Una actualización",
  );
  assert.equal(result.error, null);
  assert.equal(f.sends.length, 2);
  for (const send of f.sends) {
    assert.deepEqual(send.writes, ["incidencias_comentarios"]);
    assert.equal(send.params.fechaCreacion, "15/01/2026 13:00");
    assert.equal(send.templateId, 8);
  }
});

test("an empty comment cannot be saved or emailed", async () => {
  const f = fixture();
  const actions = f.load("src/app/incidencias/actions.ts");
  const result = await actions.createIncidenciaComentario("incident-id", "  ");
  assert.ok(result.error);
  assert.deepEqual(f.writes, []);
  assert.deepEqual(f.sends, []);
});
