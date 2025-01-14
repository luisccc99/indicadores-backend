const fs = require('fs');
const path = require('path');
const { app } = require('../../app');


const dir = path.join(__dirname, '../../uploads/tmp');

let server;

const mochaGlobalTeardown = async () => {
  if (!server) return;
  await server.close(() =>  process.stdout.write('Test server teardown\n'));
  removeTmpFiles();
};



const removeTmpFiles = () => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      throw err;
    }
    process.stdout.write(`Cleanning up ${dir}\n`)

    for (const file of files) {
      if (file === '.gitignore') {
        continue;
      }
      process.stdout.write(`  Removing ${file}\n`)
      fs.unlink(path.join(dir, file), (error) => {
        if (error) {
          throw error;
        }
      });
    }
  });
}

const mochaGlobalSetup = () => {
  server = app.listen(process.env.PORT || 8080, () => process.stdout.write(`Test server set up\n`));
}

module.exports = { mochaGlobalTeardown, mochaGlobalSetup };