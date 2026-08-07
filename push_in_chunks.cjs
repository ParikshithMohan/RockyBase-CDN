const fs = require('fs');
const { execSync } = require('child_process');

console.log('Resetting git repository...');
try { execSync('rmdir /s /q .git', { stdio: 'ignore' }); } catch(e) {}
execSync('git init', { stdio: 'inherit' });
execSync('git remote add origin https://github.com/ParikshithMohan/RockyBase-CDN.git', { stdio: 'inherit' });
execSync('git branch -m main', { stdio: 'inherit' });

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.webp'));
const chunkSize = 100;

console.log(`Total files to upload: ${files.length}`);

for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const batchNum = Math.floor(i / chunkSize) + 1;
    console.log(`\nProcessing chunk ${batchNum} of ${Math.ceil(files.length / chunkSize)}...`);
    
    fs.writeFileSync('chunk.txt', chunk.join('\n'));
    
    try {
        console.log('Adding files...');
        execSync('git add --pathspec-from-file=chunk.txt', { stdio: 'inherit' });
        
        console.log('Committing...');
        execSync(`git commit -m "Upload batch ${batchNum}"`, { stdio: 'inherit' });
        
        console.log('Pushing to GitHub...');
        let pushSuccess = false;
        let attempts = 0;
        while (!pushSuccess && attempts < 5) {
            attempts++;
            try {
                if (batchNum === 1) {
                    execSync('git push -u origin main --force', { stdio: 'inherit' });
                } else {
                    execSync('git push origin main', { stdio: 'inherit' });
                }
                pushSuccess = true;
            } catch (err) {
                console.log(`Push attempt ${attempts} failed. Retrying in 5 seconds...`);
                execSync('ping 127.0.0.1 -n 6 > nul');
            }
        }
        if (!pushSuccess) {
            throw new Error('Push failed after 5 attempts.');
        }
        console.log(`Successfully uploaded batch ${batchNum}`);
    } catch (err) {
        console.error(`Error processing batch: ${err.message}`);
        process.exit(1);
    }
}

if (fs.existsSync('chunk.txt')) fs.unlinkSync('chunk.txt');
console.log('\\nALL CHUNKS UPLOADED SUCCESSFULLY!');
