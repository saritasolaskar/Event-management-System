
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BACKUP_SUFFIX = `.backup-${new Date()
  .toISOString()
  .replace(/[:.]/g, "-")}`;

const changes = [];

function readFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  return fs.readFileSync(fullPath, "utf8");
}

function replaceRegexOnce(source, regex, replacement, description) {
  const matches = [...source.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g'))];

  if (matches.length !== 1) {
    throw new Error(
      `${description}: expected exactly one match, found ${matches.length}.`
    );
  }

  return source.replace(regex, replacement);
}

function updateFile(relativePath, transform) {
  const original = readFile(relativePath);
  const updated = transform(original);

  if (updated !== original) {
    changes.push({ relativePath, original, updated });
  }
}

function addRoleImport(source) {
  if (/from\s+["']\.\.\/utils\/roles["']/.test(source)) {
    return source;
  }

  return replaceRegexOnce(
    source,
    /import\s+\{\s*useAuth\s*\}\s+from\s+["']\.\.\/auth\/AuthContext["'];/,
    (match) => `${match}\nimport { hasAnyRole } from "../utils/roles";`,
    "Adding the role helper import"
  );
}

function updateNavigation(relativePath) {
  updateFile(relativePath, (source) => {
    let result = addRoleImport(source);

    result = replaceRegexOnce(
      result,
      /return\s+item\.roles\.includes\(user\?\.role\);/,
      "return hasAnyRole(user, item.roles);",
      `${relativePath}: navigation role filter`
    );

    return result;
  });
}

function updateMutationRoles(source, fileName) {
  const pattern = /const MUTATION_ROLES\s*=\s*\[[\s\S]*?\];/;
  const matches = [...source.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"))];

  if (matches.length !== 1) {
    throw new Error(
      `${fileName}: expected one MUTATION_ROLES array, found ${matches.length}.`
    );
  }

  const current = matches[0][0];

  if (/"SUPER_ADMIN"/.test(current)) {
    return source;
  }

  const updated = `const MUTATION_ROLES = [
    "SUPER_ADMIN",
    "ADMIN",
    "OPERATIONS_MANAGER",
];`;

  return source.replace(pattern, updated);
}

function updateDeletePermission(source, fileName) {
  const pattern = /const canDelete\s*=\s*user\?\.role\s*===\s*["']ADMIN["'];/;

  if (pattern.test(source)) {
    return source.replace(
      pattern,
      'const canDelete = ["SUPER_ADMIN", "ADMIN"].includes(user?.role);'
    );
  }

  if (/const canDelete\s*=\s*\["SUPER_ADMIN",\s*"ADMIN"\]\.includes\(user\?\.role\);/.test(source)) {
    return source;
  }

  throw new Error(`${fileName}: could not safely identify canDelete permission.`);
}

function updateCanManage(source, fileName, allowedRoles) {
  const pattern = /const canManage\s*=\s*\[([^\]]*)\]\.includes\(user\?\.role\);/;

  const alreadyCorrect = new RegExp(
    `const canManage\\s*=\\s*\\[\\s*${allowedRoles
      .map((role) => role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s*,\\s*")}\\s*\\]\\.includes\\(user\\?\\.role\\);`
  );

  if (alreadyCorrect.test(source)) {
    return source;
  }

  const matches = [...source.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))];

  if (matches.length !== 1) {
    throw new Error(`${fileName}: could not safely identify canManage permission.`);
  }

  return source.replace(
    pattern,
    `const canManage = [${allowedRoles.map((role) => `"${role}"`).join(", ")}].includes(user?.role);`
  );
}

function updateDashboardPermission(source, variableName) {
  const pattern = new RegExp(
    `(const ${variableName}\\s*=\\s*)([\\s\\S]*?)(?=;\\s*\\n)`
  );

  const matches = [...source.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))];

  if (matches.length !== 1) {
    throw new Error(
      `AdminDashboard.jsx: could not safely identify ${variableName}.`
    );
  }

  const currentExpression = matches[0][2];

  if (/role\s*===\s*ROLES\.SUPER_ADMIN/.test(currentExpression)) {
    return source;
  }

  if (!/role\s*===\s*ROLES\.ADMIN/.test(currentExpression)) {
    throw new Error(
      `AdminDashboard.jsx: ${variableName} does not match the expected structure.`
    );
  }

  return source.replace(
    pattern,
    (_, declaration, expression) =>
      `${declaration}role === ROLES.SUPER_ADMIN ||\n    ${expression}`
  );
}

function updateAuthorizeMiddleware(source) {
  const administrativeRoles = `const ADMINISTRATIVE_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPERATIONS_MANAGER",
  "DISPATCHER",
  "ACCOUNTS",
  "SUPPORT",
];

`;

  if (!source.includes("const ADMINISTRATIVE_ROLES =")) {
    source = replaceRegexOnce(
      source,
      /const AppError = require\(["']\.\.\/utils\/AppError["']\);\s*/,
      (match) => `${match}\n${administrativeRoles}`,
      "Adding administrative role definitions"
    );
  }

  const oldPermissionCheck =
    /if\s*\(!allowedRoles\.includes\(req\.user\.role\)\)\s*\{\s*return next\(new AppError\("You do not have permission to perform this action\.",\s*403\)\);\s*\}/;

  if (oldPermissionCheck.test(source)) {
    return source.replace(
      oldPermissionCheck,
      `const superAdminHasAdministrativeAccess =
      req.user.role === "SUPER_ADMIN" &&
      allowedRoles.some((role) => ADMINISTRATIVE_ROLES.includes(role));

    if (
      !allowedRoles.includes(req.user.role) &&
      !superAdminHasAdministrativeAccess
    ) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }`
    );
  }

  if (
    source.includes("superAdminHasAdministrativeAccess") &&
    source.includes("ADMINISTRATIVE_ROLES")
  ) {
    return source;
  }

  throw new Error(
    "authorize.middleware.js: permission check did not match the expected code."
  );
}

function prepareChanges() {
  // 1. Shared frontend role helper.
  updateFile("frontend/src/utils/roles.js", (source) => {
    const pattern =
      /export const hasAnyRole = \(user, roles = \[\]\) => \{[\s\S]*?\n\};/;

    if (!pattern.test(source)) {
      if (source.includes("roles.some((role) => ADMIN_ROLES.includes(role))")) {
        return source;
      }

      throw new Error("roles.js: could not locate hasAnyRole.");
    }

    return source.replace(
      pattern,
      `export const hasAnyRole = (user, roles = []) => {
  if (!user?.role) {
    return false;
  }

  // SUPER_ADMIN inherits administrative access, not personal portals.
  if (user.role === ROLES.SUPER_ADMIN) {
    return roles.some((role) => ADMIN_ROLES.includes(role));
  }

  return roles.includes(user.role);
};`
    );
  });

  // 2–3. Desktop and mobile navigation.
  updateNavigation("frontend/src/layouts/Sidebar.jsx");
  updateNavigation("frontend/src/layouts/MobileNavigation.jsx");

  // 4. Backend administrative authorization.
  updateFile(
    "backend/src/middleware/authorize.middleware.js",
    updateAuthorizeMiddleware
  );

  // 5. Client management permissions.
  updateFile("frontend/src/pages/admin/ClientManagement.jsx", (source) => {
    const pattern =
      /const canManage\s*=\s*user\?\.role\s*===\s*ROLES\.ADMIN\s*;/;

    if (pattern.test(source)) {
      return source.replace(
        pattern,
        "const canManage = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role);"
      );
    }

    if (/const canManage\s*=\s*\[ROLES\.SUPER_ADMIN,\s*ROLES\.ADMIN\]\.includes\(user\?\.role\);/.test(source)) {
      return source;
    }

    throw new Error("ClientManagement.jsx: could not locate canManage.");
  });

  // 6. Event management permissions.
  updateFile("frontend/src/pages/admin/EventManagement.jsx", (source) => {
    let result = updateMutationRoles(source, "EventManagement.jsx");
    result = updateDeletePermission(result, "EventManagement.jsx");
    return result;
  });

  // 7. Guest management permissions.
  updateFile("frontend/src/pages/admin/GuestManagement.jsx", (source) => {
    let result = updateMutationRoles(source, "GuestManagement.jsx");
    result = updateDeletePermission(result, "GuestManagement.jsx");
    return result;
  });

  // 8. Vehicle assignments.
  updateFile(
    "frontend/src/pages/admin/VehicleAssignmentManagement.jsx",
    (source) =>
      updateCanManage(
        source,
        "VehicleAssignmentManagement.jsx",
        ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER"]
      )
  );

  // 9. Guest assignments.
  updateFile(
    "frontend/src/pages/admin/GuestAssignmentManagement.jsx",
    (source) =>
      updateCanManage(
        source,
        "GuestAssignmentManagement.jsx",
        ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER"]
      )
  );

  // 10. Dashboard visibility.
  updateFile("frontend/src/pages/admin/AdminDashboard.jsx", (source) => {
    let result = source;

    for (const variableName of [
      "canViewClients",
      "canViewGuests",
      "canViewVehicles",
      "canViewDrivers",
    ]) {
      result = updateDashboardPermission(result, variableName);
    }

    return result;
  });
}

function main() {
  console.log("SUPER_ADMIN permission update");
  console.log(`Project directory: ${ROOT}`);
  console.log("");

  try {
    prepareChanges();
  } catch (error) {
    console.error("STOPPED: no source files have been written.");
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  if (changes.length === 0) {
    console.log("No changes were necessary.");
    console.log("Check the current source files to confirm their permissions.");
    return;
  }

  // Make all backups before writing any changed source file.
  const backups = [];

  try {
    for (const change of changes) {
      const fullPath = path.join(ROOT, change.relativePath);
      const backupPath = fullPath + BACKUP_SUFFIX;

      fs.copyFileSync(fullPath, backupPath);
      backups.push({ fullPath, backupPath });

      console.log(`Backup created: ${change.relativePath}${BACKUP_SUFFIX}`);
    }

    for (const change of changes) {
      fs.writeFileSync(
        path.join(ROOT, change.relativePath),
        change.updated,
        "utf8"
      );

      console.log(`UPDATED: ${change.relativePath}`);
    }

    console.log("");
    console.log(`Finished. Updated ${changes.length} file(s).`);
    console.log("Backups are available if you need to restore the originals.");
    console.log("Run the frontend and backend checks before committing.");
  } catch (error) {
    console.error("");
    console.error("ERROR while writing files. Attempting to restore originals.");

    for (const change of changes) {
      try {
        fs.writeFileSync(
          path.join(ROOT, change.relativePath),
          change.original,
          "utf8"
        );
      } catch (restoreError) {
        console.error(
          `RESTORE FAILED: ${change.relativePath}: ${restoreError.message}`
        );
      }
    }

    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
