# 🛠️ BPR CLI Reference

`bpr` (BulletProof React CLI) is the primary scaffolding tool for this project.
**Always prefer `bpr` over creating files manually.** It generates the correct folder
structure, boilerplate, and file names following bulletproof-react conventions.

## Global Flags

| Flag | Description |
|------|-------------|
| `-d, --dry-run` | Preview what would be created without writing any files |
| `-v, --verbose` | Show detailed output |
| `--config string` | Custom config file path (default: `$HOME/.bpr.yaml`) |
| `--version` | Print version |

---

## `bpr create feature <name>`

Scaffolds a full feature with all subdirectories.

**Generated structure:**
```
features/<name>/
├── api/
├── components/
├── hooks/
├── stores/
├── types/
├── utils/
└── index.ts
```

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--with-api` | false | Include `api/` layer |
| `--with-assets` | false | Include `assets/` layer |
| `--with-components` | true | Include `components/` layer |
| `--with-hooks` | true | Include `hooks/` layer |
| `--with-stores` | false | Include `stores/` layer |
| `--with-stories` | false | Generate Storybook stories |
| `--with-styles` | true | Generate styled-components styles |
| `--with-tests` | true | Generate test files |
| `--with-types` | true | Include `types/` layer |
| `--with-utils` | false | Include `utils/` layer |
| `--dry-run` | false | Preview without creating |
| `--verbose` | false | Detailed output |

**Examples:**

```bash
# Minimal feature (components + hooks + types + tests only)
bpr create feature user-profile

# Feature with API, stores, and utils
bpr create feature notifications --with-api --with-stores --with-utils

# Full-featured with Storybook
bpr create feature dashboard --with-api --with-stores --with-stories --with-utils

# Preview before creating
bpr create feature payments --with-api --dry-run

# Alias: feat
bpr c feat auth --with-api --with-stores --with-types
```

---

## `bpr create component <name>`

Scaffolds a single component.

**Examples:**

```bash
# Create a shared component
bpr create component Button

# Create with verbose output
bpr create component DataTable --verbose

# Alias: c
bpr c component Modal
```

---

## `bpr create hook <name>`

Scaffolds a custom React hook.

**Examples:**

```bash
# Create a shared hook
bpr create hook useDisclosure

# Create with verbose output
bpr create hook useLocalStorage --verbose

# Alias: c
bpr c hook useMediaQuery
```

---

## Common Workflows

### Starting a new feature

```bash
# 1. Preview what will be created
bpr create feature user-settings --with-api --with-stores --dry-run

# 2. Create it for real
bpr create feature user-settings --with-api --with-stores --with-tests

# 3. Fill in the generated files:
#    - features/user-settings/types/index.ts    ← define types first
#    - features/user-settings/api/              ← API functions + hooks
#    - features/user-settings/components/       ← UI components
#    - features/user-settings/stores/           ← Zustand/Jotai store
```

### Adding a component to an existing feature

```bash
# Navigate to the feature directory first, then:
bpr create component UserCard

# Or create directly with a path if supported:
bpr create component UserSettingsForm
# Then move the file into src/features/user-settings/components/
```

### Creating a shared hook

```bash
bpr create hook useDebounce
# Output goes to src/hooks/use-debounce.ts
```

---

## Notes

- `bpr` follows kebab-case for folder/file names and PascalCase for component exports.
- Generated test files use Vitest + React Testing Library by default.
- Generated story files use Storybook CSF format.
- The `--with-styles` flag generates styled-components boilerplate.
- Use `--dry-run` liberally to confirm structure before committing.