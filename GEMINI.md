# Project Context: Express to NestJS Migration

Current Stack: Express, Sequelize, JavaScript.
Target Stack: NestJS, TypeORM, TypeScript, NX Monorepo.
Patterns: DDD, Repository Pattern.
Instructions: Always check /libs for existing types before creating new ones.

# Migration Rules

Директория `/src` и все вложенные в нее поддиректории и файлы относятся к файлам старой версии
сервера использующего Express

# Permissions

- Shell Execution: Allowed (without confirmation)
- File System: Full access (create, delete, edit)
- Tool Use: Auto-apply fixes and migrations

# Quality Control: Biome

- Formatters: Do NOT ignore Biome rules!
- After creating or modifying any TypeScript/JavaScript file, ALWAYS run: `npx @biomejs/biome check --write <file_path>`
- If Biome reports errors that cannot be auto-fixed, the Agent must analyze the error and fix the code manually.
- Do not consider a task finished until `npx @biomejs/biome ci` passes for the affected module.

# NX Architecture Rules

- При создании новых библиотек (libs) всегда используй префикс `@lsrv/`.
- Шаблон `importPath` должен строго соответствовать: `@lsrv/<lib_name>`.
- Пример: библиотека `auth-data-access` должна иметь путь `@lsrv/auth-data-access`.
- Всегда используй флаг `--importPath=@lsrv/<name>` при запуске генераторов nx.
