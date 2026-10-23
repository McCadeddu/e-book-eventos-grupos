const { execSync } = require("child_process");

const mode = process.argv[2] ?? "auto";

function changedFiles() {
    return execSync("git status --porcelain", { encoding: "utf-8" })
        .split("\n")
        .filter(Boolean)
        .map((line) => line.slice(3));
}

function addFiles(files) {
    if (files.length === 0) {
        return;
    }

    const quotedFiles = files.map((file) => `"${file}"`).join(" ");
    execSync(`git add ${quotedFiles}`, { stdio: "inherit" });
}

const files = changedFiles();

if (files.length === 0) {
    console.log("✅ Nada para publicar.");
    process.exit(0);
}

const contentFiles = files.filter((file) =>
    file === "styles/globals.css" ||
    file === "public/villaregia-logo.png" ||
    file === "public/villaregia-capa.png" ||
    file.startsWith("pages/livro/") ||
    file.startsWith("components/")
);

const codeFiles = files.filter((file) => !contentFiles.includes(file));

if (mode === "content") {
    if (codeFiles.length > 0) {
        console.error(
            "Há mudanças de código fora do escopo de conteúdo. Use npm run publish ou npm run publish:code."
        );
        process.exit(1);
    }

    addFiles(contentFiles);
    execSync(`git commit -m "content: update public ebook presentation"`, {
        stdio: "inherit",
    });
} else if (mode === "code") {
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "feat: update app behavior and public ebook"`, {
        stdio: "inherit",
    });
} else if (contentFiles.length && !codeFiles.length) {
    addFiles(contentFiles);
    execSync(`git commit -m "content: update public ebook presentation"`, {
        stdio: "inherit",
    });
} else {
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "feat: update app behavior and public ebook"`, {
        stdio: "inherit",
    });
}

execSync("git push", { stdio: "inherit" });
