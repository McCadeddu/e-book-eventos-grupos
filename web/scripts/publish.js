import { execSync } from "child_process";

function changedFiles() {
    return execSync("git status --porcelain", { encoding: "utf-8" })
        .split("\n")
        .filter(Boolean)
        .map(line => line.slice(3));
}

const files = changedFiles();

if (files.length === 0) {
    console.log("✅ Nada para publicar.");
    process.exit(0);
}

const contentFiles = files.filter(f =>
    f.startsWith("../data/") || f === "styles/globals.css"
);

const codeFiles = files.filter(f =>
    !contentFiles.includes(f)
);

if (contentFiles.length && !codeFiles.length) {
    execSync(
        `git add ${contentFiles.join(" ")} && git commit -m "content: update grupos e eventos"`,
        { stdio: "inherit" }
    );
} else {
    execSync(
        `git add . && git commit -m "feat: update codigo e conteudo"`,
        { stdio: "inherit" }
    );
}

execSync("git push", { stdio: "inherit" });
