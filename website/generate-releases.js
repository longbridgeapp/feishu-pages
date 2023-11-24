const fs = require('fs');
const fetch = require('node-fetch');

const targetFile = 'docs/releases.md';
const repo = 'longbridgeapp/feishu-pages';
const pageSize = 200;

const fetchRelease = async () => {
  const data = await (
    await fetch(
      `https://api.github.com/repos/${repo}/releases?per_page=${pageSize}`
    )
  ).json();

  let frontMatter = `---\neditLink: false\noutline: 2\n---\n\n`;

  let releaseBody = frontMatter + '# Releases\n\n';
  data.forEach((release) => {
    let name = release.name || release.tag_name;

    releaseBody += `## [${name}](${release.html_url})\n\n`;
    let body = release.body;
    // Replace h2 with h3
    body = body.replace(/^#####/gm, '######');
    body = body.replace(/^####/gm, '#####');
    body = body.replace(/^###/gm, '####');
    body = body.replace(/^##/gm, '###');
    releaseBody += `${body}\n\n`;
  });
  fs.writeFileSync(targetFile, releaseBody, 'utf-8');
};

fetchRelease().then(() => {
  console.log('Generate releases success.');
});
