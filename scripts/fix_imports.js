const fs = require('fs');
const path = require('path');

const files = [
  'features/auth/screens/AuthScreen.tsx',
  'features/auth/screens/RegisterScreen.tsx',
  'features/auth/screens/EmailVerificationScreen.tsx',
  'features/auth/screens/ForgotPasswordScreen.tsx',
];

files.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/from '\.\.\//g, "from '../../../");
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in ${file}`);
  }
});
