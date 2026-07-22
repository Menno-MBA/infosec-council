#!/usr/bin/env node
/**
 * infosec-council installer / builder.
 *
 * Zero runtime dependencies – pure Node (>=16), cross-platform (Windows/macOS/Linux).
 *
 * Usage (works straight from the public repo, no npm publish needed):
 *   npx github:<owner>/infosec-council               # install into ./.claude (this project)
 *   npx github:<owner>/infosec-council --global      # install into ~/.claude (every project)
 *   npx github:<owner>/infosec-council build-desktop # assemble dist/infosec-council-desktop.zip
 *
 * After publishing to npm you can also do:  npx infosec-council
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const PKG_ROOT = path.resolve(__dirname, "..");
const VERSION = (() => { try { return require(path.join(PKG_ROOT, "package.json")).version; } catch (e) { return "?"; } })();
const SKILL_NAME = "infosec-council";
// The seven council personas that ship in the Claude.ai/Desktop council edition.
const COUNCIL_PERSONAS = [
  "ciso.md", "security-architect.md", "offensive-security.md", "security-operations.md",
  "compliance-analyst.md", "dpo.md", "risk-manager.md"
];
// Operational team skills that ship alongside the council in the Claude Code / plugin edition.
const TEAM_SKILLS = ["infosec-redteam", "infosec-blueteam", "infosec-incidentteam"];

// --- tiny arg parse ------------------------------------------------------
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("-")));
const cmd = argv.find((a) => !a.startsWith("-")) || "install";
const GLOBAL = flags.has("--global") || flags.has("-g");
const FORCE = flags.has("--force") || flags.has("-f");
const RESET = flags.has("--reset-config");
const HELP = flags.has("--help") || flags.has("-h");
const SHOWVER = flags.has("--version") || flags.has("-v");

const C = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function help() {
  console.log(`
${C.b("infosec-council")} – a Claude council of seven security experts.

${C.b("Commands")}
  install            Install the council for Claude Code (default)
  verify             Check the shipped scripts against their SHA-256 manifest
  build-desktop      Build the uploadable Claude.ai/Desktop skill zip
  build-plugin       Build a standalone Claude Code plugin (dir + zip)
  help               Show this message

${C.b("Install options")}
  --global, -g       Install into ~/.claude (available in every project)
                     default: ./.claude (this project only)
  --force, -f        Overwrite an existing install (keeps your context.md and
                     backs up a customized frameworks.md to frameworks.md.prev)
  --reset-config     With --force, also overwrite your context.md and frameworks.md
                     with the shipped templates (you lose local tuning)

${C.b("Examples")}
  npx github:<owner>/${SKILL_NAME}            ${C.dim("# project-scoped install")}
  npx github:<owner>/${SKILL_NAME} --global   ${C.dim("# global install")}
  npx github:<owner>/${SKILL_NAME} build-desktop
`);
}

// --- recursive copy (dependency-free, works on all supported Node) --------
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function ensureEmptyOrForce(target, label) {
  if (fs.existsSync(target) && !FORCE) {
    console.error(
      `${C.yellow("!")} ${label} already exists:\n  ${target}\n  Re-run with ${C.b("--force")} to overwrite.`
    );
    process.exit(1);
  }
}

function install() {
  const base = GLOBAL ? path.join(os.homedir(), ".claude") : path.join(process.cwd(), ".claude");
  const agentsSrc = path.join(PKG_ROOT, ".claude", "agents");
  const skillSrc = path.join(PKG_ROOT, ".claude", "skills", SKILL_NAME);

  if (!fs.existsSync(agentsSrc) || !fs.existsSync(skillSrc)) {
    console.error(`${C.yellow("!")} Could not find source files under ${PKG_ROOT}/.claude, is the package intact?`);
    process.exit(1);
  }

  const agentsDest = path.join(base, "agents");
  const skillDest = path.join(base, "skills", SKILL_NAME);

  ensureEmptyOrForce(skillDest, "Skill folder");

  // agents: copy each file (don't blow away other agents the user has)
  fs.mkdirSync(agentsDest, { recursive: true });
  let nAgents = 0;
  for (const f of fs.readdirSync(agentsSrc)) {
    if (!f.endsWith(".md")) continue;
    fs.copyFileSync(path.join(agentsSrc, f), path.join(agentsDest, f));
    nAgents++;
  }
  // Preserve user-owned config across an upgrade (the whole skill folder is
  // about to be replaced). context.md is pure user config; frameworks.md is a
  // hybrid (we ship register updates, the user tunes the Part A knobs). Losing
  // either on `--force` was a real data-loss bug, so guard against it unless the
  // user explicitly asks for --reset-config.
  const notes = [];
  let keepContext = null;
  let prevFrameworks = null;
  if (fs.existsSync(skillDest) && !RESET) {
    const ctxOld = path.join(skillDest, "context.md");
    if (fs.existsSync(ctxOld)) keepContext = fs.readFileSync(ctxOld);
    const fwOld = path.join(skillDest, "frameworks.md");
    const fwNew = path.join(skillSrc, "frameworks.md");
    if (fs.existsSync(fwOld) && fs.existsSync(fwNew) && !fs.readFileSync(fwOld).equals(fs.readFileSync(fwNew))) {
      prevFrameworks = fs.readFileSync(fwOld);
    }
  }

  // skill: replace the whole folder
  if (fs.existsSync(skillDest)) fs.rmSync(skillDest, { recursive: true, force: true });
  copyDir(skillSrc, skillDest);

  // restore preserved config
  if (keepContext != null) {
    fs.writeFileSync(path.join(skillDest, "context.md"), keepContext);
    notes.push("kept your existing context.md (your house positions were not touched)");
  }
  if (prevFrameworks != null) {
    fs.writeFileSync(path.join(skillDest, "frameworks.md.prev"), prevFrameworks);
    notes.push("shipped an updated frameworks.md; your previous copy is saved as frameworks.md.prev, re-apply any tuned knobs (control baseline, in-scope regimes)");
  }

  // team skills: the operational red/blue/incident playbooks ship alongside the
  // council. They carry no user-tuned config, so copy them verbatim.
  let nTeamSkills = 0;
  for (const s of TEAM_SKILLS) {
    const src = path.join(PKG_ROOT, ".claude", "skills", s);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(base, "skills", s);
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    copyDir(src, dest);
    nTeamSkills++;
  }

  // shared, non-skill resources (exercise fixtures/examples the team skills
  // reference via ../infosec-shared/...). Not a loadable skill, but it must ship
  // so those cross-skill pointers resolve for every install method.
  let sharedInstalled = false;
  const sharedSrc = path.join(PKG_ROOT, ".claude", "skills", "infosec-shared");
  if (fs.existsSync(sharedSrc)) {
    const sharedDest = path.join(base, "skills", "infosec-shared");
    if (fs.existsSync(sharedDest)) fs.rmSync(sharedDest, { recursive: true, force: true });
    copyDir(sharedSrc, sharedDest);
    sharedInstalled = true;
  }

  console.log(`${C.green("✓")} Installed ${C.b(String(nAgents) + " agents")} → ${agentsDest}`);
  console.log(`${C.green("✓")} Installed skill ${C.b(SKILL_NAME)} → ${skillDest}`);
  if (nTeamSkills > 0) console.log(`${C.green("✓")} Installed ${C.b(String(nTeamSkills) + " team skills")} (redteam, blueteam, incidentteam)`);
  if (sharedInstalled) console.log(`${C.green("✓")} Installed ${C.b("shared exercise fixtures")} (infosec-shared)`);
  console.log(`${C.green("✓")} infosec-council ${C.b("v" + VERSION)} installed${GLOBAL ? " globally" : ""}.`);
  for (const n of notes) console.log(`  ${C.yellow("•")} ${n}`);
  if (RESET) console.log(`  ${C.yellow("•")} --reset-config: context.md and frameworks.md were reset to the shipped templates.`);
  console.log(`\n  ${GLOBAL ? "Open Claude Code anywhere" : "Run " + C.b("claude") + " in this folder"} and try:`);
  console.log(`  ${C.dim("ask the infosec-council: <your decision> -deep")}\n`);
}

// --- minimal, dependency-free .zip writer (deflate) -----------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function listFiles(dir, base, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".DS_Store") continue;
    const full = path.join(dir, e.name);
    const rel = path.posix.join(base, e.name);
    if (e.isDirectory()) listFiles(full, rel, out);
    else out.push({ full, rel });
  }
}
function writeZip(srcDir, topName, zipPath) {
  const files = [];
  listFiles(srcDir, topName, files);
  const locals = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const data = fs.readFileSync(f.full);
    const crc = crc32(data);
    const comp = zlib.deflateRawSync(data);
    const name = Buffer.from(f.rel, "utf8");
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8); // deflate
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, name, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, name);
    offset += lh.length + name.length + comp.length;
  }
  const localBuf = Buffer.concat(locals);
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16);
  fs.writeFileSync(zipPath, Buffer.concat([localBuf, centralBuf, eocd]));
}

function buildDesktop() {
  const dist = path.join(PKG_ROOT, "dist");
  const build = path.join(dist, SKILL_NAME);
  const zipPath = path.join(dist, `${SKILL_NAME}-desktop.zip`);

  fs.rmSync(build, { recursive: true, force: true });
  fs.rmSync(zipPath, { force: true });
  fs.mkdirSync(path.join(build, "personas"), { recursive: true });

  const skillDir = path.join(PKG_ROOT, ".claude", "skills", SKILL_NAME);
  fs.copyFileSync(path.join(PKG_ROOT, "desktop", "SKILL.md"), path.join(build, "SKILL.md"));
  fs.copyFileSync(path.join(skillDir, "frameworks.md"), path.join(build, "frameworks.md"));
  fs.copyFileSync(path.join(skillDir, "context.md"), path.join(build, "context.md"));
  fs.copyFileSync(path.join(skillDir, "report.js"), path.join(build, "report.js"));
  fs.copyFileSync(path.join(skillDir, "report.sh"), path.join(build, "report.sh"));
  fs.copyFileSync(path.join(skillDir, "journal.js"), path.join(build, "journal.js"));
  fs.copyFileSync(path.join(skillDir, "journal.sh"), path.join(build, "journal.sh"));
  copyDir(path.join(skillDir, "assets"), path.join(build, "assets"));
  for (const f of COUNCIL_PERSONAS) {
    fs.copyFileSync(path.join(PKG_ROOT, ".claude", "agents", f), path.join(build, "personas", f));
  }

  // zip with the built-in writer – no external tools, works on every OS
  writeZip(build, SKILL_NAME, zipPath);
  console.log(`${C.green("✓")} Built ${C.b(zipPath)}`);
  console.log(`\n  Upload in Claude.ai/Desktop: Settings → Capabilities (enable Code execution`);
  console.log(`  & file creation, and Skills), then Skills → Upload skill → choose the zip.\n`);
}

// --- assemble a standalone Claude Code plugin (default root layout) ----------
function buildPlugin() {
  const dist = path.join(PKG_ROOT, "dist");
  const build = path.join(dist, `${SKILL_NAME}-plugin`);
  const zipPath = path.join(dist, `${SKILL_NAME}-plugin.zip`);

  fs.rmSync(build, { recursive: true, force: true });
  fs.rmSync(zipPath, { force: true });
  fs.mkdirSync(path.join(build, ".claude-plugin"), { recursive: true });

  // Manifest with the DEFAULT root layout: agents/ and skills/ auto-discovered,
  // so this artifact does not depend on the .claude/ custom-path manifest.
  const manifest = {
    name: SKILL_NAME,
    displayName: "Information Security Council",
    version: VERSION,
    description:
      "A council of seven information-security experts (CISO, Security Architect, Offensive Security, Security Operations, Compliance, DPO, Risk) who deliberate a decision, cross-examine anonymously, force a debate when consensus is too clean, and return one calibrated verdict. EU-SME focused.",
    author: { name: "Luméro", url: "https://lumero.nl" },
    homepage: "https://lumero.nl",
    repository: "https://github.com/Menno-MBA/infosec-council",
    license: "MIT",
    keywords: ["security", "ciso", "gdpr", "nis2", "iso27001", "risk", "compliance", "council", "dpo"]
  };
  fs.writeFileSync(path.join(build, ".claude-plugin", "plugin.json"), JSON.stringify(manifest, null, 2) + "\n");

  // components at the plugin root (NOT under .claude/)
  copyDir(path.join(PKG_ROOT, ".claude", "agents"), path.join(build, "agents"));
  copyDir(path.join(PKG_ROOT, ".claude", "skills"), path.join(build, "skills"));
  for (const f of ["README.md", "LICENSE", "LICENSE-CC-BY-SA-4.0.txt"]) {
    const s = path.join(PKG_ROOT, f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(build, f));
  }

  writeZip(build, SKILL_NAME, zipPath);
  console.log(`${C.green("✓")} Built plugin dir ${C.b(build)}`);
  console.log(`${C.green("✓")} Built plugin zip ${C.b(zipPath)}`);
  console.log(`\n  Test locally:   ${C.dim("claude --plugin-dir " + build)}`);
  console.log(`  Or via zip:     ${C.dim("claude --plugin-dir " + zipPath)}`);
  console.log(`  Marketplace:    ${C.dim("/plugin marketplace add Menno-MBA/infosec-council")}\n`);
}

// Tamper-evidence: verify the shipped executable scripts against their
// SHA-256 manifest. These scripts run locally straight from GitHub, so a
// user can confirm the copy they fetched was not altered or corrupted. The
// manifest ships in-repo, so this detects accidental corruption and casual
// tampering; for a hard supply-chain guarantee compare the manifest hash out
// of band or rely on npm provenance (see SECURITY.md).
function verifyIntegrity() {
  let integrity;
  try { integrity = require(path.join(PKG_ROOT, "scripts", "integrity.js")); }
  catch (e) { console.error(`${C.yellow("!")} integrity tool missing (scripts/integrity.js); this copy cannot self-verify.`); process.exit(1); }
  const r = integrity.check(PKG_ROOT);
  if (r.error) { console.error(`${C.yellow("!")} ${r.error}`); process.exit(1); }
  if (r.ok) { console.log(`${C.green("✓")} Integrity OK: all ${C.b(String(r.checked))} executable files match the recorded SHA-256 manifest.`); return; }
  console.error(`${C.yellow("!")} Integrity check FAILED, the package scripts do not match their manifest:`);
  r.mismatches.forEach((f) => console.error(`  ${C.yellow("altered")}    ${f}`));
  r.missing.forEach((f) => console.error(`  ${C.yellow("missing")}    ${f}`));
  r.untracked.forEach((f) => console.error(`  ${C.yellow("untracked")}  ${f}`));
  console.error(`\n  Do not trust this copy until you can explain these changes: re-fetch from a trusted source, or, if you edited it yourself, regenerate with ${C.dim("node scripts/integrity.js --write")}.`);
  process.exit(1);
}

if (SHOWVER || cmd === "version") console.log(`infosec-council v${VERSION}`);
else if (HELP || cmd === "help") help();
else if (cmd === "install") install();
else if (cmd === "verify") verifyIntegrity();
else if (cmd === "build-desktop" || cmd === "build") buildDesktop();
else if (cmd === "build-plugin") buildPlugin();
else {
  console.error(`Unknown command: ${cmd}\n`);
  help();
  process.exit(1);
}
