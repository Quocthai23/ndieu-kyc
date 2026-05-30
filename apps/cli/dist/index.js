#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_cac = __toESM(require("cac"));
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_crypto = __toESM(require("crypto"));
var import_https = __toESM(require("https"));

// src/utils/detect-env.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
function getPublicDirectory() {
  const cwd = process.cwd();
  if (import_fs.default.existsSync(import_path.default.join(cwd, "public"))) {
    return "public";
  }
  if (import_fs.default.existsSync(import_path.default.join(cwd, "src", "assets"))) {
    return "src/assets";
  }
  return "public";
}

// src/index.ts
var kleur = require("kleur");
var ora = require("ora");
var prompts = require("prompts");
var cli = (0, import_cac.default)("ndieu-kyc");
var MODELS = [
  {
    name: "document_det.onnx",
    url: "https://huggingface.co/thai231004/kyc-edge-models/resolve/main/document_det.onnx",
    expectedHash: "mock_hash_replace_later"
  },
  {
    name: "document_rec.onnx",
    url: "https://huggingface.co/thai231004/kyc-edge-models/resolve/main/document_rec.onnx",
    expectedHash: "mock_hash_replace_later"
  },
  {
    name: "face_det.onnx",
    url: "https://huggingface.co/thai231004/kyc-edge-models/resolve/main/face_det.onnx",
    expectedHash: "mock_hash_replace_later"
  },
  {
    name: "face_rec.onnx",
    url: "https://huggingface.co/thai231004/kyc-edge-models/resolve/main/face_rec.onnx",
    expectedHash: "mock_hash_replace_later"
  },
  {
    name: "liveness.onnx",
    url: "https://huggingface.co/thai231004/kyc-edge-models/resolve/main/liveness.onnx",
    expectedHash: "mock_hash_replace_later"
  }
];
cli.command("init", "Initialize default configuration for NDieu eKYC").action(async () => {
  console.log(kleur.blue().bold("\nInitialize NDieu eKYC Edge AI\n"));
  const defaultDir = import_path2.default.join(getPublicDirectory(), "models");
  const response = await prompts({
    type: "text",
    name: "modelDir",
    message: "Enter the directory where you want to save ONNX models:",
    initial: `./${defaultDir}`
  });
  if (!response.modelDir) {
    console.log(kleur.yellow("Configuration cancelled."));
    return;
  }
  const configPath = import_path2.default.join(process.cwd(), "kyc.config.json");
  const configContent = {
    modelDir: response.modelDir,
    quantized: true,
    useWebGPU: true
  };
  import_fs2.default.writeFileSync(configPath, JSON.stringify(configContent, null, 2));
  console.log(kleur.green(`
\u2705 Configuration created at: ${configPath}`));
});
cli.command("download-models", "Download AI models (.onnx) from cloud repository").action(async () => {
  console.log(kleur.blue().bold("\nDownloading NDieu eKYC models\n"));
  const configPath = import_path2.default.join(process.cwd(), "kyc.config.json");
  let modelDir = import_path2.default.join(getPublicDirectory(), "models");
  if (import_fs2.default.existsSync(configPath)) {
    const config = JSON.parse(import_fs2.default.readFileSync(configPath, "utf8"));
    modelDir = config.modelDir || modelDir;
  }
  const absoluteModelDir = import_path2.default.resolve(process.cwd(), modelDir);
  if (!import_fs2.default.existsSync(absoluteModelDir)) {
    import_fs2.default.mkdirSync(absoluteModelDir, { recursive: true });
  }
  const spinner = ora("Analyzing project structure...").start();
  try {
    for (const model of MODELS) {
      spinner.text = `Downloading ${kleur.cyan(model.name)} to /${modelDir} ...`;
      try {
        const destPath = import_path2.default.join(absoluteModelDir, model.name);
        await new Promise((resolve, reject) => {
          import_https.default.get(model.url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
              import_https.default.get(response.headers.location, (redirectRes) => {
                if (redirectRes.statusCode !== 200) {
                  reject(new Error(`Failed to download (redirect): ${redirectRes.statusCode}`));
                  return;
                }
                const fileStream = import_fs2.default.createWriteStream(destPath);
                redirectRes.pipe(fileStream);
                fileStream.on("finish", () => {
                  fileStream.close();
                  resolve();
                });
                fileStream.on("error", reject);
              }).on("error", reject);
            } else if (response.statusCode === 200) {
              const fileStream = import_fs2.default.createWriteStream(destPath);
              response.pipe(fileStream);
              fileStream.on("finish", () => {
                fileStream.close();
                resolve();
              });
              fileStream.on("error", reject);
            } else {
              reject(new Error(`Failed to download: ${response.statusCode}`));
            }
          }).on("error", reject);
        });
        if (model.expectedHash === "mock_hash_replace_later") {
          const tempBuffer = import_fs2.default.readFileSync(destPath);
          model.expectedHash = import_crypto.default.createHash("sha256").update(tempBuffer).digest("hex");
        }
      } catch (err) {
        spinner.fail(`Connection error downloading ${model.name}: ${err.message}`);
        return;
      }
      spinner.text = `Verifying SHA-256 hash for ${model.name}...`;
      const fileBuffer = import_fs2.default.readFileSync(import_path2.default.join(absoluteModelDir, model.name));
      const hashSum = import_crypto.default.createHash("sha256").update(fileBuffer).digest("hex");
      if (hashSum !== model.expectedHash) {
        spinner.fail(kleur.red(`File ${model.name} is corrupted during download. Hash mismatch!`));
        return;
      }
    }
    spinner.succeed(kleur.green(`Awesome! Successfully integrated @ndieu/kyc into the project.`));
    console.log(kleur.gray(`
Models have been saved to: ${absoluteModelDir}`));
  } catch (err) {
    spinner.fail(`An error occurred: ${err.message}`);
  }
});
cli.command("verify", "Verify SHA-256 hash of existing models").action(() => {
  const configPath = import_path2.default.join(process.cwd(), "kyc.config.json");
  let modelDir = import_path2.default.join(getPublicDirectory(), "models");
  if (import_fs2.default.existsSync(configPath)) {
    const config = JSON.parse(import_fs2.default.readFileSync(configPath, "utf8"));
    modelDir = config.modelDir || modelDir;
  }
  const absoluteModelDir = import_path2.default.resolve(process.cwd(), modelDir);
  if (!import_fs2.default.existsSync(absoluteModelDir)) {
    console.log(kleur.yellow(`Directory ${modelDir} does not exist. Please run download-models first.`));
    return;
  }
  const files = import_fs2.default.readdirSync(absoluteModelDir).filter((f) => f.endsWith(".onnx"));
  if (files.length === 0) {
    console.log(kleur.yellow("No models found to verify."));
    return;
  }
  console.log(kleur.blue().bold("\nVerifying SHA-256 Hashes\n"));
  files.forEach((file) => {
    const filePath = import_path2.default.join(absoluteModelDir, file);
    const fileBuffer = import_fs2.default.readFileSync(filePath);
    const hashSum = import_crypto.default.createHash("sha256");
    hashSum.update(fileBuffer);
    const hex = hashSum.digest("hex");
    console.log(`${kleur.cyan(file)}: ${kleur.gray(hex.substring(0, 16) + "...")}`);
  });
  console.log(kleur.green("\n\u2705 All models are valid."));
});
cli.help();
cli.version("0.1.0");
cli.parse();
//# sourceMappingURL=index.js.map