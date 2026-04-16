const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Users className="w-5 h-5 text-primary-foreground" />
            </motion.div>;

const replacement = <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/20 border border-border/40"
            >
              <Image src="/logo.png" alt="TeamDynamics Logo" width={40} height={40} className="object-cover scale-[1.15]" priority />
            </motion.div>;

// Standardize CRLF to LF in content before replace if needed. Or just replace using split/join to ignore whitespaces differences.
const regex = /<motion\.div\s*whileHover=\{\{\s*rotate:\s*15\s*\}\}\s*className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary\/20"\s*>\s*<Users className="w-5 h-5 text-primary-foreground"\s*\/>\s*<\/motion\.div>/g;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
