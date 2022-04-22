#!/usr/bin/env node

/**
 * kolorist 是一个轻量级的使命令行输出带有色彩的工具。
 * 并且，说起这类工具，我想大家很容易想到的就是 chalk。
 * 不过相比较 chalk 而言，两者包的大小差距并不明显，前者为 49.9 kB，后者为 33.6 kB。
 * 不过 kolorist 可能较为小众，npm 的下载量大大不如后者 chalk，
 * 相应地 chalk 的 API 也较为详尽。
 */

//其中，fs 和 path 是 Node 内置的模块，前者用于文件相关操作、后者用于文件路径相关操作。
const fs = require("fs");
const path = require("path");

const argv = require("minimist")(process.argv.slice(2)); //minimist 是一个轻量级的用于解析命令行参数的工具。说起解析命令行的工具，我想大家很容易想到 commander。相比较 commander 而言，minimist 则以轻取胜！因为它只有 32.4 kB，commander 则有 142 kB，即也只有后者的约 1/5。
const { prompt } = require("enquirer"); //用于命令行的提示

//这里没引用kolorist，无关紧要

//根目录
const cwd = process.cwd();

//每个项目模版下都是先创建的 _gitignore 文件，在后续创建项目的时候再替换掉该文件的命名（替换为 .gitignore）。所以，CLI 会预先定义一个对象来存放需要重命名的文件
//💡💡做gitignore的兼容
const renameFiles = {
  _gitignore: ".gitignore",
};

async function init() {
  // 获取目标目录
  let targetDir = argv._[0];
  if (!targetDir) {
    /**
     * @type {{ name: string }}
     * 如果没有目标目录则提示用户输入
     */
    const { name } = await prompt({
      type: "input",
      name: "name",
      message: `Project name:`,
      initial: "vite@vue2-project",
    });
    targetDir = name;
  }
  //其中，argv._[0] 代表 create-app 后的第一个参数，root 是通过 path.join 函数构建的完整文件路径
  //拼接路径 https://vimsky.com/examples/usage/node-js-path-join-method.html
  const root = path.join(cwd, targetDir);
  console.log(`Scaffolding project in ${root}...`);

  //判断文件夹是否存在
  if (!fs.existsSync(root)) {
    //不存在直接创建
    fs.mkdirSync(root, { recursive: true });
  } else {
    // 反之，如果存在该文件夹，则会判断此时文件夹下是否存在文件，即使用 fs.readdirSync(root) 获取该文件夹下的文件：
    const existing = fs.readdirSync(root);
    if (existing.length) {
      //长度不为0，存在文件
      /**
       * @type {{ yes: boolean }}
       */
      const { yes } = await prompt({
        type: "confirm",
        name: "yes",
        initial: "Y",
        message:
          `Target directory ${targetDir} is not empty.\n` +
          `Remove existing files and continue?`,
      });
      //存在文件是否删除然后继续，是，删除文件
      if (yes) {
        //删除文件并继续
        emptyDir(root);
      } else {
        return;
      }
    }
  }

  //选择模板
  // determine template
  // let template = argv.t || argv.template;
  // if (!template) {
  //   /**
  //    * @type {{ t: string }}
  //    */
  //   const { t } = await prompt({
  //     type: "select",
  //     name: "t",
  //     message: `Select a template:`,
  //     choices: ["vanilla", "vue", "vue-ts", "react", "react-ts"],
  //   });
  //   template = t;
  // }

  //选定模板，按理来说是上面的用户去选择模板的，但是因为我只做vite-vue的模板所以这里就定死了
  const templateDir = path.join(__dirname, `template-vue2`);

  const write = (file, content) => {
    //初始化renameFiles，如果有
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      //👇
      copy(path.join(templateDir, file), targetPath);
    }
  };

  //由于通过 fs.readdirSync 函数返回的是该文件夹下的文件名构成的数组
  const files = fs.readdirSync(templateDir);
  //过滤掉package文件
  for (const file of files.filter((f) => f !== "package.json")) {
    //写入
    write(file);
  }

  //处理package
  //之所以单独处理 package.json 文件的原因是每个项目模版内的 package.json 的 name 都是写死的
  //而当用户创建项目后，name 都应该为该项目的文件夹命名。
  const pkg = require(path.join(templateDir, `package.json`));
  //root为目标路径
  //path.basename 函数则用于获取一个完整路径的最后的文件夹名
  pkg.name = path.basename(root);
  //写入，content参数的作用就是，对指定的文件 file 写入指定的内容 content
  write("package.json", JSON.stringify(pkg, null, 2));

  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  console.log(`  npm install (or \`yarn\`)`);
  console.log(`  npm run dev (or \`yarn dev\`)`);
  console.log();
}

//copy 函数则用于复制文件或文件夹 src 到指定文件夹 dest。它会先获取 src 的状态 stat，如果 src 是文件夹的话，即 stat.isDirectory() 为 true 时，则会调用上面介绍的 copyDir 函数来复制 src 文件夹下的文件到 dest 文件夹下。反之，src 是文件的话，则直接调用 fs.copyFileSync 函数复制 src 文件到 dest 文件夹下。
function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    const abs = path.resolve(dir, file);
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs);
      fs.rmdirSync(abs);
    } else {
      fs.unlinkSync(abs);
    }
  }
}

init().catch((e) => {
  console.error(e);
});
